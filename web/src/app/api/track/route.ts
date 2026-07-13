import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase-server";

/**
 * App-level money-flow analytics. The client POSTs one event per confirmed money
 * action (deposit/withdraw/buy/send). Deduped by tx signature so retries/double
 * calls don't double-count. Best-effort — never blocks the user's transaction.
 *
 * NOTE: this is an internal metric, not user-facing. It's not fully abuse-proof
 * (a public endpoint) — every row carries the tx `sig`, so bogus rows can be
 * filtered later by verifying signatures on-chain if needed.
 */
const KINDS = new Set(["deposit", "withdraw", "buy", "send"]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      wallet?: string;
      kind?: string;
      asset?: string;
      usd?: number;
      sig?: string;
      chain?: string;
    };

    const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";
    const kind = typeof body.kind === "string" ? body.kind : "";
    if (!wallet || !KINDS.has(kind)) {
      return NextResponse.json({ error: "invalid event" }, { status: 400 });
    }
    const usd = typeof body.usd === "number" && isFinite(body.usd) && body.usd >= 0 ? body.usd : null;

    const supabase = getSupabaseServer();
    // Dedup on the unique `sig`; ignore if we've already recorded this tx.
    const { error } = await supabase
      .from("events")
      .upsert(
        {
          wallet,
          kind,
          asset: typeof body.asset === "string" ? body.asset.slice(0, 64) : null,
          usd,
          sig: typeof body.sig === "string" ? body.sig.slice(0, 128) : null,
          chain: body.chain === "ethereum" ? "ethereum" : "solana",
        },
        { onConflict: "sig", ignoreDuplicates: true },
      );
    if (error) {
      console.error("track insert failed:", error.message);
      return NextResponse.json({ error: "insert failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
