import { NextResponse } from "next/server";

import { isBetaIdentity, parseBetaList } from "@oxar/sdk";

// Which yield sources are gated, and who may see them. Same soft-gate model as
// /api/access/check: the client reports its identity, we answer what it may see.
// Not a security boundary (the tokens are public and every action is signed by the
// user's own wallet) — it keeps a real-money pilot away from testers, and lives
// server-side only so the allowlist never ships in the client bundle.
export const runtime = "nodejs";

/** Sources hidden behind the beta allowlist — must match `YieldProvider.id`. */
const BETA_ASSETS = ["onre-onyc"] as const;

/** Fallback so the pilot works on deploy without touching env. Extend WITHOUT a
 *  deploy via BETA_ASSET_EMAILS / BETA_ASSET_WALLETS in Vercel (use
 *  `printf '%s'` when piping — `echo` appends a newline and breaks the match). */
const DEFAULT_EMAILS = ["daniel.l@oxar.app"];

export async function POST(req: Request) {
  let body: { email?: unknown; wallet?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowed = isBetaIdentity(
    {
      email: typeof body.email === "string" ? body.email : null,
      wallet: typeof body.wallet === "string" ? body.wallet : null,
    },
    {
      emails: [...DEFAULT_EMAILS, ...parseBetaList(process.env.BETA_ASSET_EMAILS)],
      wallets: parseBetaList(process.env.BETA_ASSET_WALLETS),
    },
  );

  return NextResponse.json({ assets: allowed ? BETA_ASSETS : [] });
}
