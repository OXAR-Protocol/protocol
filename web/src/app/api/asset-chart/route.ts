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

/** A close and WHEN it closed. The time was being parsed away, so the chart could
 *  say what a point was worth but never when — half an answer, and the half people
 *  ask for when they're studying a move before buying. */
export interface ChartPoint {
  /** Unix SECONDS, as Jupiter's datapi returns them. */
  t: number;
  close: number;
}

// Server cache (mint:range → points), 5 min.
const cache = new Map<string, { at: number; points: ChartPoint[] }>();
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
    return NextResponse.json({ points: hit.points, closes: hit.points.map((p) => p.close) });
  }

  try {
    const url =
      `https://datapi.jup.ag/v2/charts/${mint}` +
      `?interval=${cfg.interval}&to=${Date.now()}&candles=${cfg.candles}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) return NextResponse.json({ points: [], closes: [] });
    const json = (await res.json()) as { candles?: { time?: number; close?: number }[] };
    const points: ChartPoint[] = (json.candles ?? [])
      .filter(
        (c): c is { time: number; close: number } =>
          typeof c.close === "number" && c.close > 0 && typeof c.time === "number",
      )
      .map((c) => ({ t: c.time, close: c.close }));
    cache.set(cacheKey, { at: Date.now(), points });
    // `closes` stays for anything still reading the old shape.
    return NextResponse.json({ points, closes: points.map((p) => p.close) });
  } catch (e) {
    console.error("Asset-chart route error:", e);
    return NextResponse.json({ points: [], closes: [] });
  }
}
