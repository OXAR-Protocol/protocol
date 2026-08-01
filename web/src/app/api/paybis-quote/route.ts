import { NextResponse } from "next/server";

import { PAYBIS_FIATS, buildPaybisQuote, type PaybisFiat, type PaybisSide } from "@oxar/sdk";

/**
 * Quote a Paybis order so the sheet can show the number BEFORE the user commits —
 * what lands on the card when selling, what lands in the wallet when buying. Their
 * quote endpoints are public and unauthenticated; we proxy to keep the browser off a
 * third-party origin and to shape their errors like ours.
 */
export const runtime = "nodejs";

const QUOTE_URL: Record<PaybisSide, string> = {
  sell: "https://api.paybis.com/public/processing/v2/quote/sell-crypto",
  buy: "https://api.paybis.com/public/processing/v2/quote/buy-crypto",
};

/** Fiat carries cents; USDC amounts we send are whole-ish and their API rounds anyway. */
const DECIMALS: Record<PaybisSide, number> = { sell: 2, buy: 2 };

export async function POST(req: Request) {
  let body: { amount?: unknown; fiat?: unknown; side?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  const { fiat, side } = body;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (typeof fiat !== "string" || !PAYBIS_FIATS.includes(fiat as PaybisFiat)) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }
  if (side !== "buy" && side !== "sell") {
    return NextResponse.json({ error: "Unsupported side" }, { status: 400 });
  }

  try {
    const res = await fetch(QUOTE_URL[side], {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildPaybisQuote(side, amount.toFixed(DECIMALS[side]), fiat as PaybisFiat)),
    });
    const json = await res.json();
    if (!res.ok) {
      // Below their minimum is the common case and reads fine to a user as-is.
      return NextResponse.json({ error: json?.message || "No quote" }, { status: 422 });
    }
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "Quote unavailable" }, { status: 502 });
  }
}
