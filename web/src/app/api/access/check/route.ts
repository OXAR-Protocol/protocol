import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseServer } from "@/lib/supabase-server";
import { fetchRank } from "@/lib/waitlist-referral";

export const runtime = "nodejs";

// Soft barrier for the closed alpha: after Privy login, the client asks whether
// the signed-in email is allowlisted. Non-allowlisted users see "coming soon".
// Not a hard security boundary — the app is non-custodial, every action still
// needs the user's own wallet — so a client-reported email check is enough.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX = 60;

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
  const ipHash = hashIp(clientIp(req));
  if (!checkRate(ipHash)) {
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
  const { data: allowRow, error } = await supabase
    .from("allowlist")
    .select("email")
    .ilike("email", email) // case-insensitive exact match (no wildcards)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (allowRow) {
    return NextResponse.json({ allowed: true });
  }

  // Not allowlisted — report waitlist standing so the gate can pick the right
  // "coming soon" state: already on the list (with their referral rank) vs. not
  // yet (offer the sign-up form).
  const { data: wlRow } = await supabase
    .from("waitlist")
    .select("serial, ref_code")
    .eq("email", email)
    .maybeSingle();

  if (!wlRow) {
    return NextResponse.json({ allowed: false, onWaitlist: false });
  }

  const rank = wlRow.ref_code ? await fetchRank(supabase, wlRow.ref_code) : null;
  return NextResponse.json({
    allowed: false,
    onWaitlist: true,
    serial: wlRow.serial,
    refCode: wlRow.ref_code,
    rank,
  });
}
