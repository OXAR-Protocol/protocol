import { NextRequest, NextResponse } from "next/server";

/**
 * Why the gasless path failed, written where we can read it.
 *
 * Kora failing is not itself a bug — the money path falls back to native gas on
 * purpose. But the REASON only ever reached `console.warn` in the user's own
 * browser, so a wallet holding no SOL saw "free fees are briefly unavailable" and
 * we had no way to learn whether the node was down, the relayer refused the
 * transaction, or the wallet couldn't partial-sign. Three different faults wearing
 * one sentence, diagnosable only by asking the user for a screenshot.
 *
 * This is a log line, not a database: no schema to migrate, no PII beyond a public
 * wallet address, and it shows up in the platform logs next to the request that
 * caused it. Best-effort — the caller never waits for it and never fails on it.
 */
export const runtime = "nodejs";

/** Caps, because this is a public endpoint and the payload lands in our logs. */
const MAX = { wallet: 64, stage: 32, reason: 300 };

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { wallet?: unknown; stage?: unknown; reason?: unknown };
    const reason = clip(body.reason, MAX.reason);
    if (!reason) return NextResponse.json({ error: "invalid report" }, { status: 400 });

    console.error("[gasless] fell back to native gas", {
      wallet: clip(body.wallet, MAX.wallet),
      stage: clip(body.stage, MAX.stage),
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
}
