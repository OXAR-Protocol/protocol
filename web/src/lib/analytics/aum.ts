/**
 * A nightly photograph of what everyone holds.
 *
 * The arithmetic is in `@oxar/sdk` (`valueHoldings`); here is what it cannot be: the
 * chain read, the price fetch, and the row write.
 *
 * Prices come from DefiLlama, the same source the portfolio chart already uses, for
 * one reason worth stating — it prices the Jupiter Lend receipt tokens. Those accrue
 * yield in their PRICE rather than in units (jlUSDC sits above a dollar), so a
 * valuation that skipped them would report the deposit and lose everything it earned.
 */

import { fetchWithRetry, valueHoldings, totalAum, type Valuation } from "@oxar/sdk";

import { readWalletBalances } from "@/lib/solana/balances";
import { getSupabaseServer } from "@/lib/supabase-server";
import { TRACKED_MINTS } from "@/lib/yield/position-mints";

const PRICES_URL = "https://coins.llama.fi/prices/current";

interface LlamaPrices {
  coins?: Record<string, { price?: number }>;
}

/** USD per unit for each mint asked about. A mint nobody prices is simply absent. */
export async function fetchCurrentPrices(mints: readonly string[]): Promise<Record<string, number>> {
  if (!mints.length) return {};
  const ids = mints.map((m) => `solana:${m}`).join(",");
  const out: Record<string, number> = {};
  try {
    const res = await fetchWithRetry(`${PRICES_URL}/${ids}`, undefined, {
      retries: 3,
      backoffMs: 400,
      timeoutMs: 15_000,
    });
    if (!res.ok) return out;
    const body = (await res.json()) as LlamaPrices;
    for (const [id, coin] of Object.entries(body.coins ?? {})) {
      const mint = id.split(":")[1];
      if (mint && typeof coin?.price === "number") out[mint] = coin.price;
    }
  } catch {
    // No prices means an honest zero with every mint listed as unpriced, which the
    // report shows. It must not take down the volume sync running beside it.
  }
  return out;
}

export interface AumReport {
  takenAt: string;
  totalUsd: number;
  wallets: number;
  byMint: Record<string, number>;
  /** Held but unpriced — the hole in the total, named rather than hidden. */
  unpriced: string[];
}

/**
 * Read every wallet's balances, price them together, write one snapshot.
 *
 * Balances are read sequentially for the same reason the history is: two RPC calls
 * per wallet against a rate limit that a burst walks straight into. Prices are ONE
 * request for every mint at once, after all the reading — so the whole snapshot is
 * valued at a single moment rather than drifting across the run.
 */
export async function snapshotAum(
  wallets: readonly string[],
  opts: { dry?: boolean; takenAt: string },
): Promise<AumReport> {
  const balances = new Map<string, Record<string, number>>();
  for (const wallet of wallets) {
    try {
      balances.set(wallet, await readWalletBalances(wallet, TRACKED_MINTS));
    } catch (e) {
      console.error("[aum] balance read failed", wallet, e instanceof Error ? e.message : e);
    }
  }

  const mints = new Set<string>();
  for (const held of balances.values()) for (const mint of Object.keys(held)) mints.add(mint);
  const prices = await fetchCurrentPrices([...mints]);

  const valuations: Valuation[] = [];
  const rows: Record<string, unknown>[] = [];
  for (const [wallet, held] of balances) {
    const valuation = valueHoldings(held, prices);
    valuations.push(valuation);
    for (const h of valuation.holdings) {
      rows.push({
        taken_at: opts.takenAt,
        wallet,
        mint: h.mint,
        ui_amount: h.amount,
        price_usd: h.price,
        usd: h.usd,
      });
    }
  }

  if (!opts.dry && rows.length) {
    const { error } = await getSupabaseServer().from("holdings_snapshots").upsert(rows, {
      onConflict: "taken_at,wallet,mint",
    });
    if (error) throw new Error(error.message);
  }

  const totals = totalAum(valuations);
  return {
    takenAt: opts.takenAt,
    totalUsd: totals.totalUsd,
    wallets: totals.wallets,
    byMint: totals.byMint,
    unpriced: totals.unpriced,
  };
}
