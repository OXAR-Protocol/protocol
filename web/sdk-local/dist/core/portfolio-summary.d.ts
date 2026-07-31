/**
 * Rolling a stretch of days into the figures under the chart.
 *
 * Kept apart from the series that produces them: one file answers "what happened each
 * day", this one answers "what does that add up to". Every number here is a sum or a
 * product of the days it was given — nothing is re-derived from a second source, which
 * is the only way the card can be guaranteed not to disagree with itself.
 */
import type { PerformanceDay } from "./portfolio-performance";
export interface RangePerformance {
    startUsd: number | null;
    endUsd: number | null;
    earnedUsd: number | null;
    /** The two halves of `earnedUsd`: what the market did to what you held, and what
     *  changing one holding for another cost. A bare negative total says nothing about
     *  which — and on a savings app the small ones are nearly always the second. */
    marketUsd: number;
    costUsd: number;
    /** Earned per mint over the range, so a breakdown can name the holding responsible.
     *  Sums to `earnedUsd`. */
    perMint: Record<string, number>;
    /** Time-weighted return over the range, or null when no day had money at work.
     *  Chained daily, so a range that opens on an empty wallet still reports one and a
     *  deposit inside the range cannot inflate it. */
    returnPct: number | null;
    inUsd: number;
    outUsd: number;
}
/**
 * Drop the flat run before this wallet held anything — a chart that opens with a month
 * of zeros says nothing and squashes the part that does. Keeps one zero so the first
 * deposit still reads as a rise from nothing, and only ever drops days where nothing
 * whatsoever happened, so the summary is the same either way.
 */
export declare function trimLeadingEmpty(days: readonly PerformanceDay[]): PerformanceDay[];
/** Roll a stretch of days into the figures shown under the chart. */
export declare function summarizePerformance(days: readonly PerformanceDay[]): RangePerformance;
