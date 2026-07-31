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
import { type PriceSeries } from "./portfolio-history";
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
    /** Market moves on what was already held, plus what exchanges cost to execute. */
    earnedUsd: number;
    /** External only — money entering or leaving the wallet itself. */
    inUsd: number;
    outUsd: number;
    /** Money actually at work that day: the opening value, plus external flows weighted
     *  by how much of the day was left when they landed. The denominator of the return —
     *  cash that arrived at 23:50 did not have a day to earn anything. */
    capitalUsd: number;
}
export interface RangePerformance {
    startUsd: number | null;
    endUsd: number | null;
    earnedUsd: number | null;
    /** Time-weighted return over the range, or null when no day had money at work.
     *  Chained daily, so a range that opens on an empty wallet still reports one and a
     *  deposit inside the range cannot inflate it. */
    returnPct: number | null;
    inUsd: number;
    outUsd: number;
}
/**
 * Daily performance for the last `days`, oldest first.
 *
 * `balancesNow` should be READ, not inferred: seeding the backward replay from the
 * wallet's actual balances is what keeps today's figure equal to the one on the rest
 * of the screen. Days the transaction history doesn't reach are dropped rather than
 * guessed — see BALANCE_FLOOR.
 */
export declare function portfolioSeries(params: {
    /** Unix seconds — "now". */
    now: number;
    days: number;
    /** Current holdings in UI units, by mint. */
    balancesNow: Readonly<Record<string, number>>;
    txs: readonly WalletTx[];
    prices: PriceSeries;
}): PerformanceDay[];
/**
 * Drop the flat run before this wallet held anything — a chart that opens with a month
 * of zeros says nothing and squashes the part that does. Keeps one zero so the first
 * deposit still reads as a rise from nothing, and only ever drops days where nothing
 * whatsoever happened, so the summary is the same either way.
 */
export declare function trimLeadingEmpty(days: readonly PerformanceDay[]): PerformanceDay[];
/** Roll a stretch of days into the figures shown under the chart. */
export declare function summarizePerformance(days: readonly PerformanceDay[]): RangePerformance;
