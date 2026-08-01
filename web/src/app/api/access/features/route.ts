import { NextResponse } from "next/server";

import { parseList, resolveFeatures } from "@oxar/sdk";

import { DEFAULT_PUBLIC_FEATURES } from "@/lib/yield/default-features";

// Which features this visitor may see. Same soft-gate model as /api/access/check:
// the client reports its identity, the server answers. Server-side only, so the
// allowlist never reaches the client bundle.
export const runtime = "nodejs";

/** Insiders when nothing is configured — so a pilot works right after deploy. */
const DEFAULT_INSIDER_EMAILS = ["daniel.l@oxar.app"];

/** Keys on for insiders, in code so the switch carries a commit (see below).
 *  ondo-stocks:    Delora/DFlow stock rail pilot (AAPLon) — real-money pass pending.
 *  paybis-cashout: card cash-out via Paybis. One real sale has gone through end to
 *                  end; arrival tracking and a second provider are still missing, so
 *                  it stays with insiders until the flow has been walked a few times.
 *  paybis-topup:   card top-up via Paybis, for wallets MoonPay won't serve. Ukrainian
 *                  cards are still declined by their own banks under an NBU rule, so
 *                  this only helps someone holding a card issued elsewhere. */
const DEFAULT_INSIDER_FEATURES = ["ondo-stocks", "paybis-cashout", "paybis-topup"];



/**
 * Everything is DARK unless a key is named here or in an env var.
 *
 * Vercel env vars do NOT apply to deployments that already exist — "Any change you
 * make to environment variables are not applied to previous deployments, they only
 * apply to new deployments." So setting one of these is not a live switch; it takes
 * effect on the next deploy, which any merge to main produces. Switching a key on in
 * CODE is therefore no slower, and leaves a commit explaining why.
 *   INSIDER_FEATURES=portfolio-v2    → visible to insiders
 *   PUBLIC_FEATURES=portfolio-v2     → visible to everyone
 *   INSIDER_EMAILS / INSIDER_WALLETS → who counts as an insider
 * Pipe values with `printf '%s'`, never `echo` — a trailing newline breaks the match.
 */
export async function POST(req: Request) {
  let body: { email?: unknown; wallet?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const features = resolveFeatures(
    {
      email: typeof body.email === "string" ? body.email : null,
      wallet: typeof body.wallet === "string" ? body.wallet : null,
    },
    {
      insiderEmails: [...DEFAULT_INSIDER_EMAILS, ...parseList(process.env.INSIDER_EMAILS)],
      insiderWallets: parseList(process.env.INSIDER_WALLETS),
      insiderFeatures: [...DEFAULT_INSIDER_FEATURES, ...parseList(process.env.INSIDER_FEATURES)],
      publicFeatures: [...DEFAULT_PUBLIC_FEATURES, ...parseList(process.env.PUBLIC_FEATURES)],
    },
  );

  return NextResponse.json({ features });
}
