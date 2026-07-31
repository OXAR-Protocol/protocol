import { NextResponse } from "next/server";

import {
  portfolioSeries,
  summarizePerformance,
  trimLeadingEmpty,
  type PriceSeries,
  type WalletTx,
} from "@oxar/sdk";

import { fetchWithRetry } from "@oxar/sdk";

import { heliusApiKey, fetchEnhancedHistory } from "@/lib/helius/history";
import { readWalletBalances } from "@/lib/solana/balances";
import { TRACKED_MINTS } from "@/lib/yield/position-mints";

/**
 * The portfolio over time — what it was worth, what it earned, and what moved in or
 * out — reconstructed rather than recorded. Holdings come from today's on-chain
 * balances replayed backward through the wallet's transfers; prices come from
 * DefiLlama's coins API (free, no key, one request for every mint at once). So the
 * chart and the figures under it exist from the day they ship rather than starting
 * empty, and both are derived from the same single pass.
 *
 * Server-side because it pages Helius history, which is expensive and holds a key.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRICES_URL = "https://coins.llama.fi/chart";
const MAX_DAYS = 365;
const DEFAULT_DAYS = 90;
/** Ceiling on paging, not a target — see `fetchEnhancedHistory`. 4000 transactions is
 *  deep enough for a year of ordinary use and still returns inside the request. */
const MAX_PAGES = 40;

const isAddress = (a: unknown): a is string =>
  typeof a === "string" && a.length >= 32 && a.length <= 44;

// Reconstruction is the same work every time until a new transaction lands, so the
// answer is cached like the earnings basis it sits beside.
const cache = new Map<string, { at: number; body: unknown }>();
const TTL = 300_000;

interface LlamaChart {
  coins?: Record<string, { prices?: { timestamp: number; price: number }[] }>;
}

/** Parse one DefiLlama chart response into our shape. */
async function readChart(res: Response, into: PriceSeries): Promise<void> {
  const json = (await res.json()) as LlamaChart;
  for (const [id, coin] of Object.entries(json.coins ?? {})) {
    const series = (coin.prices ?? []).map((p) => ({ t: p.timestamp, price: p.price }));
    if (series.length) into[id.replace(/^solana:/, "")] = series;
  }
}

/**
 * Daily prices per mint. One request for all of them normally — but a single
 * failure there used to zero the ENTIRE chart, which is exactly what happened in
 * production while the same call succeeded by hand: no retry, and any non-200 fell
 * silently back to "no prices", so every day valued at 0 and the chart vanished.
 *
 * Now it retries, and if the batch still fails it asks per mint, so one unpriceable
 * asset costs its own line rather than the whole picture. `status` is reported in
 * the response's debug counts so a failure is visible instead of inferred.
 */
async function fetchPrices(
  mints: string[],
  days: number,
): Promise<{ series: PriceSeries; status: string }> {
  const series: PriceSeries = {};
  if (!mints.length) return { series, status: "no-mints" };

  const ids = mints.map((m) => `solana:${m}`).join(",");
  let status = "ok";
  try {
    const res = await fetchWithRetry(`${PRICES_URL}/${ids}?period=1d&span=${days}`);
    if (res.ok) await readChart(res, series);
    else status = `batch-${res.status}`;
  } catch (e) {
    status = `batch-threw:${e instanceof Error ? e.name : "unknown"}`;
  }

  const missing = mints.filter((m) => !series[m]);
  if (missing.length) {
    status = status === "ok" ? `partial-${missing.length}` : `${status}+per-mint`;
    await Promise.all(
      missing.map(async (m) => {
        try {
          const res = await fetchWithRetry(`${PRICES_URL}/solana:${m}?period=1d&span=${days}`);
          if (res.ok) await readChart(res, series);
        } catch {
          // A mint nobody prices simply doesn't contribute — see portfolioSeries.
        }
      }),
    );
  }

  return { series, status };
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
    return NextResponse.json(cached.body);
  }

  try {
    // Balances are READ; only the movements are replayed. See `readWalletBalances`.
    // History is paged until it reaches back past the window rather than to a fixed
    // count — a year on a busy wallet needs more than 2500 transactions, and a week
    // on a quiet one needs one page.
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - days * 86_400;
    const [history, balancesNow] = await Promise.all([
      fetchEnhancedHistory(owner, key, MAX_PAGES, windowStart),
      readWalletBalances(owner, TRACKED_MINTS),
    ]);

    // One transaction, one entry: the direction of its legs is what separates money
    // crossing the wallet's edge from one thing you own becoming another.
    const txs: WalletTx[] = [];
    for (const tx of history) {
      const legs: Record<string, number> = {};
      for (const t of tx.tokenTransfers ?? []) {
        if (!t.mint || typeof t.tokenAmount !== "number") continue;
        if (!TRACKED_MINTS.has(t.mint)) continue;
        const sign = t.toUserAccount === owner ? 1 : t.fromUserAccount === owner ? -1 : 0;
        if (sign === 0) continue;
        legs[t.mint] = (legs[t.mint] ?? 0) + sign * t.tokenAmount;
      }
      if (Object.keys(legs).length) txs.push({ timestamp: tx.timestamp ?? 0, legs });
    }

    const mints = new Set(Object.keys(balancesNow));
    for (const tx of txs) for (const mint of Object.keys(tx.legs)) mints.add(mint);
    const { series: prices, status: priceStatus } = await fetchPrices([...mints], days);

    const series = trimLeadingEmpty(
      portfolioSeries({
        now,
        days,
        balancesNow,
        txs,
        prices,
      }),
    );
    const performance = summarizePerformance(series);

    // Counts, not contents: an empty chart has several possible causes (no history
    // read, no tracked mint moved, no price found) and they are indistinguishable
    // from the outside. Cheap to keep, and it turns "it doesn't work" into a fact.
    // `days` short of what was asked for means the replay ran out of history there.
    const body = {
      days: series,
      performance,
      debug: {
        txs: history.length,
        trackedMints: TRACKED_MINTS.size,
        heldMints: Object.keys(balancesNow).length,
        movedMints: mints.size,
        pricedMints: Object.keys(prices).length,
        priceStatus,
        covered: series.length,
        asked: days,
      },
    };
    cache.set(cacheKey, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (e) {
    console.error("Portfolio history error:", e);
    return NextResponse.json({ error: "History request failed" }, { status: 502 });
  }
}