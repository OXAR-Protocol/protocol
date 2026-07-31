"use strict";
/**
 * Rolling a stretch of days into the figures under the chart.
 *
 * Kept apart from the series that produces them: one file answers "what happened each
 * day", this one answers "what does that add up to". Every number here is a sum or a
 * product of the days it was given — nothing is re-derived from a second source, which
 * is the only way the card can be guaranteed not to disagree with itself.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimLeadingEmpty = trimLeadingEmpty;
exports.summarizePerformance = summarizePerformance;
const portfolio_history_1 = require("./portfolio-history");
/**
 * Drop the flat run before this wallet held anything — a chart that opens with a month
 * of zeros says nothing and squashes the part that does. Keeps one zero so the first
 * deposit still reads as a rise from nothing, and only ever drops days where nothing
 * whatsoever happened, so the summary is the same either way.
 */
function trimLeadingEmpty(days) {
    const first = days.findIndex((d) => d.usd > 0 || d.earnedUsd !== 0 || d.inUsd !== 0 || d.outUsd !== 0);
    if (first < 0)
        return [];
    return days.slice(Math.max(0, first - 1));
}
/** Roll a stretch of days into the figures shown under the chart. */
function summarizePerformance(days) {
    if (!days.length) {
        return {
            startUsd: null,
            endUsd: null,
            earnedUsd: null,
            marketUsd: 0,
            costUsd: 0,
            perMint: {},
            returnPct: null,
            inUsd: 0,
            outUsd: 0,
        };
    }
    let earnedUsd = 0;
    let marketUsd = 0;
    let costUsd = 0;
    const perMint = {};
    let inUsd = 0;
    let outUsd = 0;
    let growth = 1;
    let measured = false;
    for (const d of days) {
        earnedUsd += d.earnedUsd;
        marketUsd += d.marketUsd;
        costUsd += d.costUsd;
        for (const [mint, amount] of Object.entries(d.perMint)) {
            perMint[mint] = (perMint[mint] ?? 0) + amount;
        }
        inUsd += d.inUsd;
        outUsd += d.outUsd;
        // A day that opened with nothing at work earns no return, whatever happened later
        // in it — there was no capital for a percentage to be a percentage OF.
        if (d.capitalUsd > 0 && !(0, portfolio_history_1.isDustUsd)(d.capitalUsd)) {
            growth *= 1 + d.earnedUsd / d.capitalUsd;
            measured = true;
        }
    }
    const opening = days[0];
    return {
        // What it was worth before the first day we report — by the identity above, the
        // day's close less everything that happened during it.
        startUsd: opening.usd - opening.earnedUsd - (opening.inUsd - opening.outUsd),
        endUsd: days[days.length - 1].usd,
        earnedUsd,
        marketUsd,
        costUsd,
        perMint,
        returnPct: measured ? growth - 1 : null,
        inUsd,
        outUsd,
    };
}
