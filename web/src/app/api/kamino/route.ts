import { NextRequest, NextResponse } from "next/server";

import {
  buildKaminoDepositTx,
  buildKaminoWithdrawTx,
  getKaminoApy,
  getKaminoPosition,
} from "@/lib/yield/kamino-server";

// klend + @solana/kit are Node-only and heavy — keep this off the edge runtime
// and out of the client bundle (only this server route imports them).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action, owner, amount, max } = (await req.json()) ?? {};

    switch (action) {
      case "apy":
        return NextResponse.json({ apy: await getKaminoApy() });

      case "position": {
        if (typeof owner !== "string") {
          return NextResponse.json({ error: "owner required" }, { status: 400 });
        }
        return NextResponse.json(await getKaminoPosition(owner));
      }

      case "deposit-tx": {
        if (typeof owner !== "string" || typeof amount !== "string") {
          return NextResponse.json({ error: "owner and amount required" }, { status: 400 });
        }
        return NextResponse.json({ tx: await buildKaminoDepositTx(owner, BigInt(amount)) });
      }

      case "withdraw-tx": {
        if (typeof owner !== "string") {
          return NextResponse.json({ error: "owner required" }, { status: 400 });
        }
        return NextResponse.json({
          tx: await buildKaminoWithdrawTx(owner, BigInt(amount ?? "0"), Boolean(max)),
        });
      }

      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Kamino route error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
