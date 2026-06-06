import { NextResponse } from "next/server";

import { isStockBlockedCountry } from "@/lib/compliance/geoblock";

// Reports whether tokenized stocks (Reg S) are blocked for the request's country
// (Vercel `x-vercel-ip-country`). The client uses this to show/hide the Stocks
// section on /yield. Server-side so the country check isn't spoofable from the UI.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const country = req.headers.get("x-vercel-ip-country");
  return NextResponse.json({ country, stocksBlocked: isStockBlockedCountry(country) });
}
