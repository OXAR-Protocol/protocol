"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECONDS_PER_DAY = void 0;
exports.utcDayStart = utcDayStart;
exports.isSameUtcDay = isSameUtcDay;
exports.groupByDay = groupByDay;
exports.summarizeDays = summarizeDays;
exports.activeDays = activeDays;
exports.takeByEventCount = takeByEventCount;
exports.SECONDS_PER_DAY = 86400;
/** Money going into positions. */
const INFLOW = new Set(["buy", "deposit", "receive"]);
/** Money coming back out. */
const OUTFLOW = new Set(["sell", "withdraw", "send"]);
/** 00:00 UTC of the day containing `unixSec`. */
function utcDayStart(unixSec) {
    return Math.floor(unixSec / exports.SECONDS_PER_DAY) * exports.SECONDS_PER_DAY;
}
function isSameUtcDay(a, b) {
    return utcDayStart(a) === utcDayStart(b);
}
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
function groupByDay(events, points = []) {
    const byDay = new Map();
    const dayOf = (day) => {
        let d = byDay.get(day);
        if (!d) {
            d = { day, usd: null, changeUsd: null, inUsd: 0, outUsd: 0, events: [] };
            byDay.set(day, d);
        }
        return d;
    };
    for (const p of points) {
        dayOf(utcDayStart(p.t)).usd = p.usd;
    }
    for (const e of events) {
        const d = dayOf(utcDayStart(e.timestamp));
        d.events.push(e);
        const usd = e.usd ?? 0;
        if (usd > 0) {
            if (INFLOW.has(e.kind))
                d.inUsd += usd;
            else if (OUTFLOW.has(e.kind))
                d.outUsd += usd;
        }
    }
    // Oldest first so each day can look back at the last one that had a value.
    const ascending = [...byDay.values()].sort((a, b) => a.day - b.day);
    let previous = null;
    for (const d of ascending) {
        if (d.usd !== null) {
            if (previous !== null)
                d.changeUsd = d.usd - previous;
            previous = d.usd;
        }
        d.events.sort((a, b) => b.timestamp - a.timestamp);
    }
    return ascending.reverse();
}
/**
 * Summarise the days a view is showing. `days` is expected newest-first, as
 * `groupByDay` returns it.
 *
 * The change is measured between the first and last days that actually HAVE a value,
 * not the first and last days in the list — otherwise a range that opens on a day the
 * price series doesn't cover reports no change at all.
 */
function summarizeDays(days) {
    const withValue = [...days].reverse().filter((d) => d.usd !== null);
    const startUsd = withValue.length ? withValue[0].usd : null;
    const endUsd = withValue.length ? withValue[withValue.length - 1].usd : null;
    const changeUsd = startUsd !== null && endUsd !== null ? endUsd - startUsd : null;
    let inUsd = 0;
    let outUsd = 0;
    let trades = 0;
    let activeDays = 0;
    for (const d of days) {
        inUsd += d.inUsd;
        outUsd += d.outUsd;
        trades += d.events.length;
        if (d.events.length)
            activeDays += 1;
    }
    return { startUsd, endUsd, changeUsd, inUsd, outUsd, trades, activeDays };
}
/**
 * The days worth listing. A day with a value but nothing done to it says only what
 * the chart above already draws, and there is one of those for every quiet day —
 * pages of "$0.00" rows burying the handful that record an actual decision.
 *
 * Kept separate from `groupByDay` on purpose: the change-against-the-previous-day
 * figure and the range summary must be computed over EVERY day, or a quiet stretch
 * would vanish from the arithmetic as well as from the screen.
 */
function activeDays(days) {
    return days.filter((d) => d.events.length > 0);
}
/**
 * The first `limit` transactions' worth of days, plus whether more remain.
 *
 * Counted in TRANSACTIONS rather than days: a day is not a unit of reading, and one
 * busy day can hold more rows than a fortnight of quiet ones. Days are never split —
 * the day that crosses the limit is shown whole, because half a day's trades is a
 * misleading picture of that day.
 */
function takeByEventCount(days, limit) {
    const shown = [];
    let counted = 0;
    for (const d of days) {
        if (counted >= limit)
            break;
        shown.push(d);
        counted += d.events.length;
    }
    const total = days.reduce((n, d) => n + d.events.length, 0);
    return { shown, remaining: total - counted };
}
