/**
 * Portfolio value over time, reconstructed rather than recorded.
 *
 * We store no history of what a wallet was worth, and we don't need to: the two
 * ingredients already exist. How much was held comes from replaying the wallet's
 * on-chain transfers, and what it was worth comes from a daily price series. So a
 * chart can show the past from the day it ships, instead of starting empty.
 *
 * The replay runs BACKWARD from the balance we can read right now, subtracting the
 * moves that happened since. Forward replay would need a complete history to be
 * correct; backward stays exact for recent days even when the far end is truncated,
 * and recent days are the ones anyone looks at.
 */
/** One movement of a held asset, in UI units. Positive = received. */
export interface HoldingDelta {
    mint: string;
    /** Unix seconds. */
    timestamp: number;
    delta: number;
}
/** Daily prices per mint, ascending by time. */
export type PriceSeries = Record<string, readonly {
    t: number;
    price: number;
}[]>;
export interface PortfolioPoint {
    /** Unix seconds at the end of that day. */
    t: number;
    usd: number;
}
export declare function isDustUsd(usd: number): boolean;
/** Price at or before `t`; the earliest known price before the series starts, so a
 *  position that predates our price data is valued rather than silently dropped. */
export declare function priceAt(series: readonly {
    t: number;
    price: number;
}[], t: number): number;
/**
 * Daily portfolio value for the last `days`, oldest first.
 *
 * A day's value uses the balance as of the END of that day, so a purchase shows up
 * on the day it happened rather than the next one.
 */
export declare function dailyPortfolioValue(params: {
    /** Unix seconds — "now". */
    now: number;
    days: number;
    /** Current holdings in UI units, by mint. */
    balancesNow: Readonly<Record<string, number>>;
    /** Every known movement of those mints. Order doesn't matter. */
    deltas: readonly HoldingDelta[];
    prices: PriceSeries;
}): PortfolioPoint[];
/**
 * Drop the flat run at the start — the days before this wallet held anything.
 * A chart that opens with a month of zeros says nothing and squashes the part that
 * does. Keeps one zero so the first deposit still reads as a rise from nothing.
 */
export declare function trimLeadingEmpty(points: readonly PortfolioPoint[]): PortfolioPoint[];
