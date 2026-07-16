import { NextResponse } from "next/server";

import { fetchWithRetry } from "@oxar/sdk";

// On-demand price history for ONE asset over a selectable range — powers the
// detail-sheet chart (24h / 7d / 30d / 90d). Uses Jupiter's datapi (no key).
// Separate from /api/stock-charts (which batches a fixed 48h window for the
// many card sparklines) because this is per-open and range-driven.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// range → Jupiter datapi candle interval + count.
const RANGES: Record<string, { interval: string; candles: number }> = {
  "24h": { interval: "1_HOUR", candles: 24 },
  "7d": { interval: "4_HOUR", candles: 42 },
  "30d": { interval: "1_DAY", candles: 30 },
  "90d": { interval: "1_DAY", candles: 90 },
};

const isMint = (s: string | null): s is string =>
  !!s && s.length >= 32 && s.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(s);

// Server cache (mint:range → closes), 5 min.
const cache = new Map<string, { at: number; closes: number[] }>();
const TTL = 300_000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get("mint");
  const range = searchParams.get("range") ?? "24h";
  const cfg = RANGES[range];

  if (!isMint(mint)) return NextResponse.json({ error: "Invalid mint" }, { status: 400 });
  if (!cfg) return NextResponse.json({ error: "Invalid range" }, { status: 400 });

  const cacheKey = `${mint}:${range}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) {
    return NextResponse.json({ closes: hit.closes });
  }

  try {
    const url =
      `https://datapi.jup.ag/v2/charts/${mint}` +
      `?interval=${cfg.interval}&to=${Date.now()}&candles=${cfg.candles}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) return NextResponse.json({ closes: [] });
    const json = (await res.json()) as { candles?: { close?: number }[] };
    const closes = (json.candles ?? [])
      .map((c) => c.close)
      .filter((n): n is number => typeof n === "number" && n > 0);
    cache.set(cacheKey, { at: Date.now(), closes });
    return NextResponse.json({ closes });
  } catch (e) {
    console.error("Asset-chart route error:", e);
    return NextResponse.json({ closes: [] });
  }
}
