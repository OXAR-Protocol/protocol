import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 10_000_000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

// Per-process memory — fine for Vercel fns; resets on cold start.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRate(ipHash: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ipHash);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ipHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
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

function fakeSerial(email: string): number {
  // deterministic-ish fake serial for silent honeypot response, outside real range
  const h = createHash("sha256").update(email).digest();
  return 900_000 + (h.readUInt32BE(0) % 99_999);
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown; amount?: unknown; website?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  const honeypot = typeof body.website === "string" ? body.website : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Honeypot — silently accept, but never write. Bots fill all visible fields.
  if (honeypot.length > 0) {
    return NextResponse.json({ serial: fakeSerial(email), existed: false });
  }

  const ipHash = hashIp(clientIp(req));
  if (!checkRate(ipHash)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = getSupabaseServer();
  const userAgent = req.headers.get("user-agent")?.slice(0, 255) ?? null;

  const { data: existing, error: lookupErr } = await supabase
    .from("waitlist")
    .select("serial")
    .eq("email", email)
    .maybeSingle();

  if (lookupErr) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ serial: existing.serial, existed: true });
  }

  const { data, error } = await supabase
    .from("waitlist")
    .insert({ email, amount_usd: amount, ip_hash: ipHash, user_agent: userAgent })
    .select("serial")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ serial: data.serial, existed: false });
}
