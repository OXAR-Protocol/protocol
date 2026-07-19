import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Invite-flow email capture: add the email to the `allowlist` (so access persists
// across the person's browsers/devices — the wall's per-browser unlock doesn't).
// The WAITLIST insert is done separately by the client via /api/waitlist so the
// referral logic there isn't duplicated. Soft gate (non-custodial app), so this is
// just "who sees the UI".

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function POST(req: NextRequest) {
  if (!checkRate(hashIp(clientIp(req)))) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  // Idempotent without assuming a unique constraint: only insert if not already there.
  const { data: existing, error: lookupErr } = await supabase
    .from("allowlist")
    .select("email")
    .ilike("email", email)
    .maybeSingle();
  if (lookupErr) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!existing) {
    const { error: insertErr } = await supabase.from("allowlist").insert({ email });
    if (insertErr) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
