/**
 * The two ingredients every portfolio figure is built from: what was held, and what it
 * was worth. We store no history of either and don't need to — holdings come from
 * replaying the wallet's on-chain transfers, prices from a daily series — so a chart
 * can show the past from the day it ships instead of starting empty.
 *
 * The replay runs BACKWARD from the balances we can read right now, undoing the moves
 * that happened since. Forward replay would need a complete history to be correct;
 * backward stays exact for recent days even when the far end is truncated, and recent
 * days are the ones anyone looks at.
 *
 * What is DONE with these ingredients — earnings, flows, return — lives next door in
 * `portfolio-performance.ts`.
 */
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
