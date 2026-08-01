import { NextResponse } from "next/server";

import { PAYBIS_FIATS, buildPaybisSellQuote, type PaybisFiat } from "@oxar/sdk";

/**
 * Quote a Paybis cash-out so the sheet can show the payout BEFORE the user commits.
 * Their quote endpoint is public and unauthenticated; we proxy it to keep the browser
 * off a third-party origin (CORS, and their errors shaped like ours).
 */
export const runtime = "nodejs";

const PAYBIS_QUOTE_URL = "https://api.paybis.com/public/processing/v2/quote/sell-crypto";

export async function POST(req: Request) {
  let body: { amount?: unknown; fiat?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  const fiat = body.fiat;
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (typeof fiat !== "string" || !PAYBIS_FIATS.includes(fiat as PaybisFiat)) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  try {
    const res = await fetch(PAYBIS_QUOTE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildPaybisSellQuote(amount.toFixed(2), fiat as PaybisFiat)),
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
