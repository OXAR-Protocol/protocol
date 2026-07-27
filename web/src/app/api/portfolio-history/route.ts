import { NextResponse } from "next/server";

import {
  dailyPortfolioValue,
  trimLeadingEmpty,
  type HoldingDelta,
  type PriceSeries,
} from "@oxar/sdk";

import { heliusApiKey, fetchEnhancedHistory } from "@/lib/helius/history";
import { POSITION_MINTS } from "@/lib/yield/position-mints";

/**
 * Portfolio value over time, reconstructed — we record no history and don't need
 * to. Holdings come from replaying the wallet's transfers; prices come from
 * DefiLlama's coins API (free, no key, one request for every mint at once). So the
 * chart shows the past from the day it ships rather than starting empty.
 *
 * Server-side because it pages Helius history, which is expensive and holds a key.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICES_URL = "https://coins.llama.fi/chart";
const MAX_DAYS = 365;
const DEFAULT_DAYS = 90;

const isAddress = (a: unknown): a is string =>
  typeof a === "string" && a.length >= 32 && a.length <= 44;

// Reconstruction is the same work every time until a new transaction lands, so the
// answer is cached like the earnings basis it sits beside.
const cache = new Map<string, { at: number; points: unknown }>();
const TTL = 300_000;

interface LlamaChart {
  coins?: Record<string, { prices?: { timestamp: number; price: number }[] }>;
}

/** Daily price series per mint, in ONE request. Missing mints simply value at 0. */
async function fetchPrices(mints: string[], days: number): Promise<PriceSeries> {
  if (!mints.length) return {};
  const ids = mints.map((m) => `solana:${m}`).join(",");
  const res = await fetch(`${PRICES_URL}/${ids}?period=1d&span=${days}`);
  if (!res.ok) return {};
  const json = (await res.json()) as LlamaChart;
  const out: PriceSeries = {};
  for (const [id, coin] of Object.entries(json.coins ?? {})) {
    const mint = id.replace(/^solana:/, "");
    out[mint] = (coin.prices ?? []).map((p) => ({ t: p.timestamp, price: p.price }));
  }
  return out;
}

export async function POST(req: Request) {
  const key = heliusApiKey();
  if (!key) return NextResponse.json({ error: "History unavailable" }, { status: 503 });

  let body: { owner?: unknown; days?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const owner = body.owner;
  if (!isAddress(owner)) return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
  const days = Math.min(
    Math.max(typeof body.days === "number" ? body.days : DEFAULT_DAYS, 7),
    MAX_DAYS,
  );

  const cacheKey = `${owner}:${days}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL) {
    return NextResponse.json({ points: cached.points });
  }

  try {
    const txs = await fetchEnhancedHistory(owner, key, 25);

    // Every movement of an asset we track. Balances "now" are summed from the same
    // deltas: reading them on-chain would be more precise, but it would also be a
    // second source that can disagree with the replay and bend the line at the end.
    const deltas: HoldingDelta[] = [];
    const balancesNow: Record<string, number> = {};
    for (const tx of txs) {
      for (const t of tx.tokenTransfers ?? []) {
        if (!t.mint || typeof t.tokenAmount !== "number") continue;
        if (!POSITION_MINTS.has(t.mint)) continue;
        const sign = t.toUserAccount === owner ? 1 : t.fromUserAccount === owner ? -1 : 0;
        if (sign === 0) continue;
        const delta = sign * t.tokenAmount;
        deltas.push({ mint: t.mint, timestamp: tx.timestamp ?? 0, delta });
        balancesNow[t.mint] = (balancesNow[t.mint] ?? 0) + delta;
      }
    }

    const mints = Object.keys(balancesNow);
    const prices = await fetchPrices(mints, days);
    const points = trimLeadingEmpty(
      dailyPortfolioValue({
        now: Math.floor(Date.now() / 1000),
        days,
        balancesNow,
        deltas,
        prices,
      }),
    );

    cache.set(cacheKey, { at: Date.now(), points });
    return NextResponse.json({ points });
  } catch (e) {
    console.error("Portfolio history error:", e);
    return NextResponse.json({ error: "History request failed" }, { status: 502 });
  }
}