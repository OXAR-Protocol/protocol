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
 *  platform-fee:   takes our cut on swaps (see sdk `platform-fee`). Insider-only on
 *                  purpose — the machinery ships live so it can be tested with real
 *                  money on our own account, while nobody else pays anything.
 *  paybis-cashout: card cash-out via Paybis. Works, but no arrival tracking yet.
 *  paybis-topup:   card top-up via Paybis. Pulled back from everyone: it cannot serve
 *                  the users who need it most — Ukrainian banks decline the charge —
 *                  so offering it broadly was a choice that mostly ends in a decline.
 *  bulk-one-signature: a basket signed as ONE prompt instead of one per asset
 *                  (Privy's batch overload). Insider-only until it has carried real
 *                  money on both wallet kinds — embedded and an external one — because
 *                  a refusal now costs the whole basket rather than the rest of it. */
const DEFAULT_INSIDER_FEATURES = [
  "paybis-cashout",
  "paybis-topup",
  "platform-fee",
  "bulk-one-signature",
];



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
