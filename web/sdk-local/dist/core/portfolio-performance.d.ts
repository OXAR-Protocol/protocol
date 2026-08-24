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
 * of the screen.
 *
 * Days the transaction history doesn't reach are dropped rather than guessed, and the
 * reach is bounded from both sides. A holding that goes negative means we missed the
 * inflow that started it — that is BALANCE_FLOOR, and it needs no help from the caller.
 * The other side is invisible from in here: undoing withdrawals only ever makes the
 * past look richer, so a wallet that has taken out more than it put in reconstructs a
 * balance for days it never existed. `bornAt` is how the caller closes that door.
 */
export declare function portfolioSeries(params: {
    /** Unix seconds — "now". */
    now: number;
    days: number;
    /** Current holdings in UI units, by mint. */
    balancesNow: Readonly<Record<string, number>>;
    txs: readonly WalletTx[];
    prices: PriceSeries;
    /** The wallet's FIRST transaction, in unix seconds — pass it only when `txs` came
     *  from a history that was read all the way to its end. Days closing before it are
     *  then known not to exist, rather than merely unreconstructable. Omit it whenever
     *  the history was truncated by a page cap, a window, or an error: an unknown
     *  beginning must not be mistaken for a recent one. */
    bornAt?: number;
}): PerformanceDay[];
