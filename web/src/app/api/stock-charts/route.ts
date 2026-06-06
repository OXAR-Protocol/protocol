import { NextResponse } from "next/server";

import { XSTOCKS } from "@/lib/yield/xstocks";
import { fetchWithRetry } from "@/lib/net/fetch-retry";

// Batched price-history for the stock-card sparklines. Fetches ~2 days of hourly
// closes for every xStock from Jupiter's datapi (no key) server-side, in one cached
// call — so 26 cards cost one client request, not 26. Cached 5 min.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cache: { at: number; charts: Record<string, number[]> } | null = null;
const TTL = 300_000;

async function closesFor(mint: string, to: number): Promise<number[]> {
  try {
    const res = await fetchWithRetry(
      `https://datapi.jup.ag/v2/charts/${mint}?interval=1_HOUR&to=${to}&candles=48`,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { candles?: { close?: number }[] };
    return (json.candles ?? [])
      .map((c) => c.close)
      .filter((n): n is number => typeof n === "number" && n > 0);
  } catch {
    return [];
  }
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) {
    return NextResponse.json({ charts: cache.charts });
  }
  const to = Date.now();
  const entries = await Promise.all(
    XSTOCKS.map(async (s) => [s.mint, await closesFor(s.mint, to)] as const),
  );
  const charts: Record<string, number[]> = {};
  for (const [mint, closes] of entries) if (closes.length > 1) charts[mint] = closes;
  cache = { at: Date.now(), charts };
  return NextResponse.json({ charts });
}
