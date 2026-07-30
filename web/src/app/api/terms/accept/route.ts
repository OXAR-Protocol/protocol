import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

import { TERMS_VERSION } from "@oxar/sdk";
import { getSupabaseServer } from "@/lib/supabase-server";
import { parseTermsWallet } from "@/lib/terms";

export const runtime = "nodejs";

// Records that a wallet was shown /terms (at TERMS_VERSION) and took an
// affirmative action afterward — dismissed the welcome card, or started/
// skipped the tour (see `components/intro-modal.tsx`, called via
// `lib/terms.ts#acceptTerms`, fire-and-forget from the client).
//
// This is NOT a signature, and OXAR has no operating company to be the
// counterparty for one. It evidences notice + act, at a version and a time,
// nothing more. The version is always the server's own TERMS_VERSION, never
// client-supplied — the client can't backdate or spoof which revision was live.
//
// Failure here must never surface to the user: the welcome card and tour
// already ran client-side before this fires, and every error path below
// returns a JSON error response rather than throwing — the caller ignores it
// either way (see `acceptTerms`).

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

  let body: { wallet?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const wallet = parseTermsWallet(body.wallet);
  if (!wallet) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from("terms_acceptances")
      .upsert(
        { wallet, version: TERMS_VERSION },
        { onConflict: "wallet,version", ignoreDuplicates: true },
      );
    if (error) {
      // Most likely cause in the wild: the 0006 migration hasn't been applied
      // yet, so the table doesn't exist. Log for visibility; the client never
      // sees this — it doesn't await the response body.
      console.error("terms accept insert failed:", error.message);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("terms accept unavailable:", e);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
