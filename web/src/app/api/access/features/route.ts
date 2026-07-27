import { NextResponse } from "next/server";

import { parseList, resolveFeatures } from "@oxar/sdk";

// Which features this visitor may see. Same soft-gate model as /api/access/check:
// the client reports its identity, the server answers. Server-side only, so the
// allowlist never reaches the client bundle.
export const runtime = "nodejs";

/** Insiders when nothing is configured — so a pilot works right after deploy. */
const DEFAULT_INSIDER_EMAILS = ["daniel.l@oxar.app"];

/**
 * Everything is DARK by default: a key must be named in an env var to appear.
 * Flip a feature without a deploy, in the `oxar-web` Vercel project:
 *   INSIDER_FEATURES=selling-v2,portfolio-v2   → visible to insiders
 *   PUBLIC_FEATURES=selling-v2                 → visible to everyone
 *   INSIDER_EMAILS / INSIDER_WALLETS           → who counts as an insider
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
      insiderFeatures: parseList(process.env.INSIDER_FEATURES),
      publicFeatures: parseList(process.env.PUBLIC_FEATURES),
    },
  );

  return NextResponse.json({ features });
}
