import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const KEY_RE = /^OXAR-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 30;

function checkRate(ipHash: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ipHash);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ipHash, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX) return false;
  bucket.count += 1;
  return true;
}

function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) ?? "oxar";
  return createHash("sha256").update(salt + ip).digest("hex").slice(0, 32);
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function POST(req: NextRequest) {
  const ipHash = hashIp(clientIp(req));
  if (!checkRate(ipHash)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: { key?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key.trim().toUpperCase() : "";
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: "Invalid key format" }, { status: 400 });
  }

  const keyHash = hashKey(key);
  const supabase = getSupabaseServer();

  const { data: row, error: lookupErr } = await supabase
    .from("access_keys")
    .select("id, first_used_at, use_count, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (lookupErr) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Unknown key" }, { status: 404 });
  }
  if (row.revoked_at) {
    return NextResponse.json({ error: "Key revoked" }, { status: 403 });
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date().toISOString();

  const { error: updErr } = await supabase
    .from("access_keys")
    .update({
      first_used_at: row.first_used_at ?? now,
      last_used_at: now,
      use_count: (row.use_count ?? 0) + 1,
      used_by_ip: ipHash,
      token_hash: tokenHash,
    })
    .eq("id", row.id);

  if (updErr) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ token });
}
