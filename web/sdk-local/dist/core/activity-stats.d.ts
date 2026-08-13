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
    /** What that day EARNED — the market on what was held, plus what any exchange cost
     *  to execute. Comes straight from the value series (`PerformanceDay`), never from
     *  the day-on-day value move: on a day money was added, those two differ by the
     *  deposit, and only one of them is what the day was worth to you. Null when the
     *  series doesn't cover the day. */
    earnedUsd: number | null;
    /** The two halves of `earnedUsd`, so a row can name what it is rather than leaving
     *  a bare signed figure beside a balance: what the market did to what was held,
     *  and what exchanging one holding for another cost to execute. A day that only
     *  swapped is all cost — money spent, not a holding that fell. */
    marketUsd: number | null;
    costUsd: number | null;
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
 * `points` is the daily value series (`PerformanceDay`); a day with no point keeps a
 * null value rather than borrowing a neighbour's, because a made-up number here would
 * read as a real one. Days are returned NEWEST FIRST — the order a history is read in.
 *
 * Days with neither a value nor an event are dropped: an empty row per quiet day would
 * bury the days that matter under months of nothing.
 */
export declare function groupByDay<T extends DatedFlow>(events: readonly T[], points?: readonly {
    t: number;
    usd: number;
    earnedUsd?: number;
    marketUsd?: number;
    costUsd?: number;
}[]): DayActivity<T>[];
/** How busy a stretch was. Every figure that is MONEY now comes from the value
 *  series (`summarizePerformance`), which knows what each day earned and what
 *  actually crossed the wallet's edge; the event feed is left doing the one thing it
 *  is the better source for — counting what the person did. Two summaries of the same
 *  range from two datasets is how a card ends up disagreeing with itself. */
export interface ActivityCount {
    trades: number;
    /** Days that had at least one event. */
    activeDays: number;
}
export declare function countActivity(days: readonly DayActivity[]): ActivityCount;
/**
 * The days worth listing. A day with a value but nothing done to it says only what
 * the chart above already draws, and there is one of those for every quiet day —
 * pages of "$0.00" rows burying the handful that record an actual decision.
 *
 * Kept separate from `groupByDay` on purpose: filtering is a VIEW concern. The
 * arithmetic runs over every day, or a quiet stretch would vanish from the numbers
 * as well as from the screen.
 */
export declare function activeDays<T extends DatedFlow>(days: readonly DayActivity<T>[]): DayActivity<T>[];
/**
 * The first `limit` transactions' worth of days, plus whether more remain.
 *
 * Counted in TRANSACTIONS rather than days: a day is not a unit of reading, and one
 * busy day can hold more rows than a fortnight of quiet ones. Days are never split —
 * the day that crosses the limit is shown whole, because half a day's trades is a
 * misleading picture of that day.
 */
export declare function takeByEventCount<T extends DatedFlow>(days: readonly DayActivity<T>[], limit: number): {
    shown: DayActivity<T>[];
    remaining: number;
};
