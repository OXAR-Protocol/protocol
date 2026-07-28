/**
 * Dates for a history view. Absolute, not "3d ago": a ledger is something people
 * cross-check against a bank statement or a tax return, and a relative age can't be
 * cross-checked against anything.
 *
 * Everything formats in UTC, matching the day buckets in `activity-stats` — reading a
 * timestamp in the viewer's zone would put a transaction on a different row than the
 * day it was counted in.
 */
/** e.g. "12 Mar 2026". Locale-aware, UTC. */
export declare function formatDay(unixSec: number, locale?: string): string;
/** e.g. "12 Mar" — for axes and dense rows, where the year is already established. */
export declare function formatDayShort(unixSec: number, locale?: string): string;
/** e.g. "14:32" — the time within a day, for individual transactions. */
export declare function formatTimeOfDay(unixSec: number, locale?: string): string;
