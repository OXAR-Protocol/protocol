/**
 * Turning a flat list of transactions into something a person can read.
 *
 * A feed answers "what happened last"; it doesn't answer "what did I do in March"
 * or "why is my total lower than yesterday". Both of those are day-shaped questions,
 * so the events are bucketed by day and joined to the portfolio's value on that day.
 *
 * Days are UTC. Bucketing in the viewer's zone would move a transaction between days
 * depending on where they opened the page, and the value series this joins against is
 * already built on UTC day boundaries.
 */
export declare const SECONDS_PER_DAY = 86400;
/** The least an event has to be to be counted here. */
export interface DatedFlow {
    /** Unix SECONDS (Helius' unit), not milliseconds. */
    timestamp: number;
    kind: string;
    /** USD moved; null when we couldn't price it. */
    usd: number | null;
}
/** A day's worth of history: what the portfolio was worth, and what was done to it. */
export interface DayActivity<T extends DatedFlow = DatedFlow> {
    /** Unix seconds at 00:00 UTC — the day's identity. */
    day: number;
    /** Portfolio value at that day's close; null when the series doesn't cover it. */
    usd: number | null;
    /** Against the previous day that HAS a value — not simply the day before, or a
     *  gap in the series would read as a crash to zero and back. */
    changeUsd: number | null;
    /** Money put in / taken out that day, from the events themselves. */
    inUsd: number;
    outUsd: number;
    /** That day's events, newest first. */
    events: T[];
}
/** 00:00 UTC of the day containing `unixSec`. */
export declare function utcDayStart(unixSec: number): number;
export declare function isSameUtcDay(a: number, b: number): boolean;
/**
 * Group events into days and attach each day's portfolio value.
 *
 * `points` is the daily value series (`PortfolioPoint`); a day with no point keeps a
 * null value rather than borrowing a neighbour's, because a made-up number here would
 * read as a real one. Days are returned NEWEST FIRST — the order a history is read in.
 *
 * Days with neither a value nor an event are dropped: an empty row per quiet day would
 * bury the days that matter under months of nothing.
 */
export declare function groupByDay<T extends DatedFlow>(events: readonly T[], points?: readonly {
    t: number;
    usd: number;
}[]): DayActivity<T>[];
/** Headline numbers for a stretch of days. */
export interface RangeStats {
    /** Value at the start / end of the range; null when the series doesn't reach. */
    startUsd: number | null;
    endUsd: number | null;
    /** End minus start, and the same as a fraction of the start. Null when either end
     *  is missing, or when the start was zero — there is no "percent up from nothing". */
    changeUsd: number | null;
    changePct: number | null;
    inUsd: number;
    outUsd: number;
    trades: number;
    /** Days that had at least one event. */
    activeDays: number;
}
/**
 * Summarise the days a view is showing. `days` is expected newest-first, as
 * `groupByDay` returns it.
 *
 * The change is measured between the first and last days that actually HAVE a value,
 * not the first and last days in the list — otherwise a range that opens on a day the
 * price series doesn't cover reports no change at all.
 */
export declare function summarizeDays(days: readonly DayActivity[]): RangeStats;
