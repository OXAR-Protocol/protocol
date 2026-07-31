/**
 * What the portfolio earned, and what percent that is.
 *
 * Everything here rests on one identity. Value is `balance × price`, so between two
 * days it can only move for two reasons:
 *
 *   V(d) − V(d−1) = Σ bal(d−1)×[P(d)−P(d−1)]  +  Σ [bal(d)−bal(d−1)]×P(d)
 *                   └────── earned ──────┘        └──────── flow ───────┘
 *
 * Two things follow, and they are the whole reason this file exists. Earnings never
 * need a settlement leg — only balances and prices — so a trade paid in USDT or swapped
 * token-for-token counts exactly like any other, where pricing an event by its USDC side
 * drops it. And yield arrives for free: Jupiter Lend pays by making jlUSDC worth more,
 * not by sending more of it, so its interest is a price move like any other.
 *
 * A balance moves for two very different reasons, though, and a day cannot tell them
 * apart: money arriving from outside, and one thing you own turning into another. So
 * flows are read per TRANSACTION, by the direction of its legs. That distinction is the
 * difference between reporting a swap's spread as a $1 loss (true) and as a $1
 * withdrawal (what a day-level view concludes, and it is wrong).
 *
 * See docs/plans/2026-07-31-portfolio-performance-design.md.
 */

import { isDustUsd, priceAt, type PriceSeries } from "./portfolio-history";

const DAY = 86_400;

/** A balance this far below zero means the replay ran past the history we were given —
 *  not that the wallet owed anything. Everything older is unknown, not zero. */
const BALANCE_FLOOR = -1e-6;

/** One transaction's net effect on the wallet: mint → UI units, positive = received. */
export interface WalletTx {
  /** Unix SECONDS (Helius' unit). */
  timestamp: number;
  legs: Readonly<Record<string, number>>;
}

/** One day of the portfolio: what it was worth, what it earned, what moved. */
export interface PerformanceDay {
  /** Unix seconds at the day's close. */
  t: number;
  usd: number;
  /** `marketUsd + costUsd` — the whole of what the day was worth to you. */
  earnedUsd: number;
  /** What the market did to what was already held. */
  marketUsd: number;
  /** What exchanging one holding for another cost to execute — spread, fee, a bad
   *  fill. Negative in the ordinary case. Kept apart from the market because a
   *  person seeing "−$0.03" needs to know which of the two it was, and on a savings
   *  app most small losses are this one, not a holding that fell. */
  costUsd: number;
  /** Earned per mint, market and execution cost together, so a breakdown can name
   *  the holding responsible. Sums to `earnedUsd` — a breakdown that doesn't
   *  reconcile with the figure above it is worse than none. */
  perMint: Record<string, number>;
  /** External only — money entering or leaving the wallet itself. */
  inUsd: number;
  outUsd: number;
  /** Money actually at work that day: the opening value, plus external flows weighted
   *  by how much of the day was left when they landed. The denominator of the return —
   *  cash that arrived at 23:50 did not have a day to earn anything. */
  capitalUsd: number;
}

/**
 * Daily performance for the last `days`, oldest first.
 *
 * `balancesNow` should be READ, not inferred: seeding the backward replay from the
 * wallet's actual balances is what keeps today's figure equal to the one on the rest
 * of the screen. Days the transaction history doesn't reach are dropped rather than
 * guessed — see BALANCE_FLOOR.
 */
export function portfolioSeries(params: {
  /** Unix seconds — "now". */
  now: number;
  days: number;
  /** Current holdings in UI units, by mint. */
  balancesNow: Readonly<Record<string, number>>;
  txs: readonly WalletTx[];
  prices: PriceSeries;
}): PerformanceDay[] {
  const { now, days, balancesNow, txs, prices } = params;
  const mints = new Set<string>(Object.keys(balancesNow));
  for (const tx of txs) for (const m of Object.keys(tx.legs)) mints.add(m);

  // Day boundaries, newest first: bounds[k] = k days ago. bounds[days] is a seed — the
  // close before the first day we report, so that day has a "previous" to measure from.
  const bounds = Array.from({ length: days + 1 }, (_, k) => now - k * DAY);

  // Walk backwards, undoing each transaction to recover the balances at every boundary.
  const balances: Record<string, number>[] = [{ ...balancesNow }];
  const perInterval: WalletTx[][] = [[]];
  const newestFirst = [...txs].sort((a, b) => b.timestamp - a.timestamp);
  let next = 0;
  for (let k = 1; k <= days; k++) {
    const at = { ...balances[k - 1]! };
    const inside: WalletTx[] = [];
    while (next < newestFirst.length && newestFirst[next]!.timestamp > bounds[k]!) {
      const tx = newestFirst[next]!;
      inside.push(tx);
      for (const [mint, delta] of Object.entries(tx.legs)) at[mint] = (at[mint] ?? 0) - delta;
      next++;
    }
    perInterval[k] = inside;
    balances[k] = at;
  }

  // How far back the history actually reaches: the oldest boundary we can state without
  // a negative holding, which would mean we're subtracting moves we never saw the start of.
  let oldest = days;
  while (oldest > 0 && Object.values(balances[oldest]!).some((b) => b < BALANCE_FLOOR)) oldest--;

  const out: PerformanceDay[] = [];
  for (let k = oldest; k >= 1; k--) {
    const openedAt = bounds[k]!;
    const closedAt = bounds[k - 1]!;
    const opening = balances[k]!;
    const closing = balances[k - 1]!;

    // Priced once per mint per day; the loops below all read the same two numbers.
    const before: Record<string, number> = {};
    const after: Record<string, number> = {};
    for (const mint of mints) {
      before[mint] = priceAt(prices[mint] ?? [], openedAt);
      after[mint] = priceAt(prices[mint] ?? [], closedAt);
    }

    const perMint: Record<string, number> = {};
    const credit = (mint: string, amount: number) => {
      if (amount !== 0) perMint[mint] = (perMint[mint] ?? 0) + amount;
    };

    let marketUsd = 0;
    let usd = 0;
    let capitalUsd = 0;
    for (const mint of mints) {
      const held = opening[mint] ?? 0;
      const moved = held * (after[mint]! - before[mint]!);
      marketUsd += moved;
      credit(mint, moved);
      capitalUsd += held * before[mint]!;
      usd += (closing[mint] ?? 0) * after[mint]!;
    }

    let costUsd = 0;
    let inUsd = 0;
    let outUsd = 0;
    for (const tx of perInterval[k] ?? []) {
      let value = 0;
      let acquired = 0;
      let sent = false;
      for (const [mint, delta] of Object.entries(tx.legs)) {
        const legValue = delta * (after[mint] ?? 0);
        value += legValue;
        if (delta > 0) acquired += legValue;
        else if (delta < 0) sent = true;
      }
      // Both directions AND something we can price on the receiving end: one thing you
      // own became another. If we can't price what came back, this falls through to a
      // flow instead — money going somewhere we can't see reads as leaving, which is
      // true, rather than as a loss the size of the whole trade, which isn't.
      if (acquired > 0 && sent) {
        // Nothing entered or left; what the exchange cost is the whole of its value
        // change — and it belongs to the holding it bought, because that is what the
        // money was spent getting into.
        costUsd += value;
        for (const [mint, delta] of Object.entries(tx.legs)) {
          if (delta > 0) credit(mint, value * ((delta * (after[mint] ?? 0)) / acquired));
        }
      } else {
        if (value > 0) inUsd += value;
        else outUsd += -value;
        capitalUsd += value * ((closedAt - tx.timestamp) / DAY);
      }
    }

    out.push({
      t: closedAt,
      usd: isDustUsd(usd) ? 0 : usd,
      earnedUsd: marketUsd + costUsd,
      marketUsd,
      costUsd,
      perMint,
      inUsd,
      outUsd,
      capitalUsd,
    });
  }
  return out;
}
