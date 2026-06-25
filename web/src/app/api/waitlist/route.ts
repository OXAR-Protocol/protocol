import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { PublicKey } from "@solana/web3.js";
import { getSupabaseServer } from "@/lib/supabase-server";
import {
  HEAD_START,
  generateRefCode,
  normalizeRefCode,
  isDisposableEmail,
  verifyTurnstile,
  fetchRank,
} from "@/lib/waitlist-referral";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns a normalized base58 Solana address, or null if absent/invalid.
function parseWallet(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new PublicKey(trimmed).toBase58();
  } catch {
    return null;
  }
}
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
  let body: {
    email?: unknown; amount?: unknown; website?: unknown;
    wallet?: unknown; ref?: unknown; turnstileToken?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const honeypot = typeof body.website === "string" ? body.website : "";
  const refCode = normalizeRefCode(body.ref);

  // Wallet is optional. If the field is non-empty but not a valid Solana
  // address, reject so the user can fix it; empty/absent is fine.
  const walletProvided = typeof body.wallet === "string" && body.wallet.trim().length > 0;
  const wallet = parseWallet(body.wallet);
  if (walletProvided && !wallet) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  // Amount is legacy — waitlist no longer collects it. Accept and validate
  // only if present; default to 0 so the existing NOT NULL column stays happy.
  let amount = 0;
  if (body.amount !== undefined && body.amount !== null) {
    amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Honeypot — silently accept, but never write. Bots fill all visible fields.
  if (honeypot.length > 0) {
    return NextResponse.json({ serial: fakeSerial(email), existed: false });
  }

  if (isDisposableEmail(email)) {
    return NextResponse.json({ error: "Please use a permanent email" }, { status: 400 });
  }

  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  if (!checkRate(ipHash)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const userAgent = req.headers.get("user-agent")?.slice(0, 255) ?? null;

  // Already on the list — return current standing, never re-apply a referral.
  const { data: existing, error: lookupErr } = await supabase
    .from("waitlist")
    .select("serial, ref_code")
    .eq("email", email)
    .maybeSingle();

  if (lookupErr) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (existing) {
    // Let an existing signup attach a wallet later (e.g. to claim Galxe rewards).
    // Best-effort: a failure here never blocks returning the standing.
    if (wallet) {
      await supabase.from("waitlist").update({ wallet }).eq("email", email);
    }
    const rank = existing.ref_code ? await fetchRank(supabase, existing.ref_code) : null;
    return NextResponse.json({
      serial: existing.serial, ref_code: existing.ref_code, existed: true, ...rank,
    });
  }

  // Resolve referrer: ignore unknown codes, self-referral, and same-device farming.
  let referrer: { ref_code: string } | null = null;
  if (refCode) {
    const { data: r } = await supabase
      .from("waitlist")
      .select("ref_code, email, ip_hash")
      .eq("ref_code", refCode)
      .maybeSingle();
    if (r && r.email !== email && r.ip_hash !== ipHash) referrer = { ref_code: r.ref_code };
  }

  // Insert with a unique share code (retry on the rare collision).
  let inserted: { serial: number; ref_code: string } | null = null;
  for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
    const row: Record<string, unknown> = {
      email, amount_usd: amount, ip_hash: ipHash, user_agent: userAgent,
      ref_code: generateRefCode(), referred_by: referrer?.ref_code ?? null,
      head_start: referrer ? HEAD_START : 0, referral_status: "confirmed",
    };
    if (wallet) row.wallet = wallet;
    const { data, error } = await supabase
      .from("waitlist").insert(row).select("serial, ref_code").single();
    if (!error && data) inserted = data;
    else if (error && error.code !== "23505") {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }
  if (!inserted) {
    // A concurrent submit for the same email can slip past the lookup above and
    // lose the insert race on the email unique constraint. Return their row
    // instead of a 500 — they're on the list, just not via this request.
    const { data: raced } = await supabase
      .from("waitlist").select("serial, ref_code").eq("email", email).maybeSingle();
    if (raced) {
      const rank = raced.ref_code ? await fetchRank(supabase, raced.ref_code) : null;
      return NextResponse.json({
        serial: raced.serial, ref_code: raced.ref_code, existed: true, ...rank,
      });
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (referrer) {
    await supabase.rpc("oxar_increment_referrals", { p_ref_code: referrer.ref_code });
  }

  const rank = await fetchRank(supabase, inserted.ref_code);
  return NextResponse.json({
    serial: inserted.serial, ref_code: inserted.ref_code,
    existed: false, referred: !!referrer, ...rank,
  });
}
