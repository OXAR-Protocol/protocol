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
export function formatDay(unixSec: number, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(unixSec * 1000));
}

/** e.g. "12 Mar" — for axes and dense rows, where the year is already established. */
export function formatDayShort(unixSec: number, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(unixSec * 1000));
}

/** e.g. "14:32" — the time within a day, for individual transactions. */
export function formatTimeOfDay(unixSec: number, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(unixSec * 1000));
}
