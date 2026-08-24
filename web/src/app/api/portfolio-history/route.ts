import { NextResponse } from "next/server";

import {
  portfolioSeries,
  summarizePerformance,
  trackedMints,
  walletDeltas,
  trimLeadingEmpty,
  type PriceSeries,
  type WalletTx,
} from "@oxar/sdk";

import { fetchWithRetry } from "@oxar/sdk";

import { heliusApiKey, fetchHistoryPaged, bornAtFrom } from "@/lib/helius/history";
import { readWalletBalances } from "@/lib/solana/balances";
import { TRACKED_MINTS } from "@/lib/yield/position-mints";
import { isSameOrigin } from "@/lib/rpc-proxy";

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
  // Our Helius quota pays for these. A stranger's page may not spend it — the
  // data is public on-chain, the two requests a second are not.
  if (!isSameOrigin(req.headers.get("origin"), req.url)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

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
    const [{ txs: history, exhausted, failed }, allBalances] = await Promise.all([
      fetchHistoryPaged(owner, key, MAX_PAGES, windowStart),
      readWalletBalances(owner),
    ]);

    // Everything the owner moved, transaction by transaction — as NET balance
    // changes, not as a sum of transfer legs. A routed swap moves the same dollars
    // through several pools, and adding those legs reported a $5 trade as $2,459
    // (see `walletDeltas`), which then flowed into "cost to trade" and the percent
    // return as if the wallet had thousands in it.
    const moved = history.map((tx) => ({
      timestamp: tx.timestamp ?? 0,
      legs: walletDeltas(tx, owner),
    }));

    const tracked = trackedMints(moved, TRACKED_MINTS);

    const balancesNow: Record<string, number> = {};
    for (const [mint, amount] of Object.entries(allBalances)) {
      if (tracked.has(mint)) balancesNow[mint] = amount;
    }

    // One transaction, one entry: the direction of its legs is what separates money
    // crossing the wallet's edge from one thing you own becoming another.
    const txs: WalletTx[] = [];
    for (const tx of moved) {
      const legs: Record<string, number> = {};
      for (const [mint, delta] of Object.entries(tx.legs)) {
        if (tracked.has(mint)) legs[mint] = delta;
      }
      if (Object.keys(legs).length) txs.push({ timestamp: tx.timestamp, legs });
    }

    const mints = new Set(Object.keys(balancesNow));
    for (const tx of txs) for (const mint of Object.keys(tx.legs)) mints.add(mint);
    const { series: prices, status: priceStatus } = await fetchPrices([...mints], days);

    // Read from the WHOLE history, not from `txs`. `txs` is filtered down to the
    // mints this app tracks, and the first thing a wallet ever does is usually not the
    // first thing we care about — so taking the birthday from there put it later than
    // it really was and cut off days that genuinely happened. `exhausted` describes
    // `history`, so the birthday has to come from the same list.
    const bornAt = bornAtFrom(history, exhausted);

    // What the replay implies the wallet held on the day it was born.
    //
    // When `exhausted` is true we KNOW the answer: nothing. A wallet holds nothing
    // before its first transaction. So any mint with a balance here is one whose
    // arrival we never saw — and every day from birth until that unseen arrival is
    // overstated by exactly this much. The reported chart opened at $5,549 on a
    // two-day-old wallet and sat flat for a fortnight with no transactions at all,
    // which is what that looks like from the outside.
    //
    // Counted, not corrected: subtracting a residue whose date is unknown would move
    // the error rather than remove it. This says how big the problem is and which
    // mint carries it, so the next change can be aimed instead of guessed.
    const netMoved: Record<string, number> = {};
    for (const tx of txs) {
      for (const [mint, delta] of Object.entries(tx.legs)) {
        netMoved[mint] = (netMoved[mint] ?? 0) + delta;
      }
    }
    const residue: Record<string, number> = {};
    for (const mint of mints) {
      const at = (balancesNow[mint] ?? 0) - (netMoved[mint] ?? 0);
      // UI units, so the threshold is generous — this is a diagnostic, not a guard.
      if (Math.abs(at) > 1e-6) residue[mint] = at;
    }

    const series = trimLeadingEmpty(
      portfolioSeries({
        now,
        days,
        balancesNow,
        txs,
        prices,
        ...(bornAt !== undefined ? { bornAt } : {}),
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
      // What the wallet still holds. The breakdown covers everything that MOVED money
      // in the window, which rightly includes positions closed inside it — but a list
      // that mixes them with no mark reads as "these are your positions", and the
      // reply to that is "I don't own half of these".
      heldMints: Object.keys(balancesNow).filter((m) => (balancesNow[m] ?? 0) > 0),
      debug: {
        txs: history.length,
        trackedMints: tracked.size,
        heldMints: Object.keys(balancesNow).length,
        movedMints: mints.size,
        pricedMints: Object.keys(prices).length,
        priceStatus,
        covered: series.length,
        asked: days,
        exhausted,
        failed,
        // Non-empty here with `exhausted: true` is a bug, and names the mint holding it.
        birthResidue: residue,
        birthResidueMints: Object.keys(residue).length,
        bornAt: bornAt ?? null,
      },
    };
    // A page we could not read means this answer is built on less history than the
    // wallet has, which is how a chart ends up drawing months that never happened.
    // Serving that for the next five minutes would make one rate-limited request the
    // user's whole afternoon, so a truncated answer is returned but not remembered.
    if (!failed) cache.set(cacheKey, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (e) {
    console.error("Portfolio history error:", e);
    return NextResponse.json({ error: "History request failed" }, { status: 502 });
  }
}