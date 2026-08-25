/**
 * What is held right now, in dollars — the stock beside the flow.
 *
 * Volume answers "how much moved through us"; on its own it is ambiguous in the way
 * that matters most. A thousand dollars of volume is a thousand dollars that arrived
 * and stayed, or a hundred dollars that went in and out five times, and for a yield
 * product those are opposite outcomes. Only the balance can tell them apart.
 *
 * Deliberately NOT derived from the flows. Adding up deposits and subtracting
 * withdrawals gives the money put in at the price it was put in at, which is not what
 * anybody holds: it ignores every dollar the position has earned since. Reading the
 * balance and pricing it today includes the yield, because the yield is IN the
 * balance — a Jupiter Lend receipt token accrues in its price rather than in units.
 */

/** UI units by mint — what a wallet holds. */
export type Balances = Readonly<Record<string, number>>;

/** USD per whole unit, by mint. */
export type Prices = Readonly<Record<string, number>>;

export interface Holding {
  mint: string;
  /** UI units held. */
  amount: number;
  /** Price used, USD per unit. */
  price: number;
  usd: number;
}

export interface Valuation {
  holdings: Holding[];
  totalUsd: number;
  /**
   * Mints held with no price available. Reported rather than swallowed: an unpriced
   * holding is a hole in the total, and a total that quietly ignores one is worse
   * than a total that admits it.
   */
  unpriced: string[];
}

/** Dust: a balance this small is a closed position's residue, not a holding. */
const DUST_USD = 0.01;

export function valueHoldings(balances: Balances, prices: Prices): Valuation {
  const holdings: Holding[] = [];
  const unpriced: string[] = [];
  let totalUsd = 0;

  for (const [mint, amount] of Object.entries(balances)) {
    if (!(amount > 0)) continue;
    const price = prices[mint];
    if (typeof price !== "number" || !isFinite(price) || price <= 0) {
      unpriced.push(mint);
      continue;
    }
    const usd = amount * price;
    if (usd < DUST_USD) continue;
    holdings.push({ mint, amount, price, usd });
    totalUsd += usd;
  }

  holdings.sort((a, b) => b.usd - a.usd);
  return { holdings, totalUsd, unpriced };
}

export interface AumTotals {
  totalUsd: number;
  /** Wallets holding anything at all — the ones with money actually at work. */
  wallets: number;
  /** Total by mint, so "which market holds the money" is one lookup. */
  byMint: Record<string, number>;
  unpriced: string[];
}

/** Roll per-wallet valuations into the one figure and its breakdown. */
export function totalAum(valuations: readonly Valuation[]): AumTotals {
  const byMint: Record<string, number> = {};
  const unpriced = new Set<string>();
  let totalUsd = 0;
  let wallets = 0;

  for (const v of valuations) {
    if (v.totalUsd > 0) wallets += 1;
    totalUsd += v.totalUsd;
    for (const h of v.holdings) byMint[h.mint] = (byMint[h.mint] ?? 0) + h.usd;
    for (const m of v.unpriced) unpriced.add(m);
  }

  return { totalUsd, wallets, byMint, unpriced: [...unpriced] };
}
