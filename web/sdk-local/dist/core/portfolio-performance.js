"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioSeries = portfolioSeries;
exports.trimLeadingEmpty = trimLeadingEmpty;
exports.summarizePerformance = summarizePerformance;
const portfolio_history_1 = require("./portfolio-history");
const DAY = 86400;
/** A balance this far below zero means the replay ran past the history we were given —
 *  not that the wallet owed anything. Everything older is unknown, not zero. */
const BALANCE_FLOOR = -1e-6;
/**
 * Daily performance for the last `days`, oldest first.
 *
 * `balancesNow` should be READ, not inferred: seeding the backward replay from the
 * wallet's actual balances is what keeps today's figure equal to the one on the rest
 * of the screen. Days the transaction history doesn't reach are dropped rather than
 * guessed — see BALANCE_FLOOR.
 */
function portfolioSeries(params) {
    const { now, days, balancesNow, txs, prices } = params;
    const mints = new Set(Object.keys(balancesNow));
    for (const tx of txs)
        for (const m of Object.keys(tx.legs))
            mints.add(m);
    // Day boundaries, newest first: bounds[k] = k days ago. bounds[days] is a seed — the
    // close before the first day we report, so that day has a "previous" to measure from.
    const bounds = Array.from({ length: days + 1 }, (_, k) => now - k * DAY);
    // Walk backwards, undoing each transaction to recover the balances at every boundary.
    const balances = [{ ...balancesNow }];
    const perInterval = [[]];
    const newestFirst = [...txs].sort((a, b) => b.timestamp - a.timestamp);
    let next = 0;
    for (let k = 1; k <= days; k++) {
        const at = { ...balances[k - 1] };
        const inside = [];
        while (next < newestFirst.length && newestFirst[next].timestamp > bounds[k]) {
            const tx = newestFirst[next];
            inside.push(tx);
            for (const [mint, delta] of Object.entries(tx.legs))
                at[mint] = (at[mint] ?? 0) - delta;
            next++;
        }
        perInterval[k] = inside;
        balances[k] = at;
    }
    // How far back the history actually reaches: the oldest boundary we can state without
    // a negative holding, which would mean we're subtracting moves we never saw the start of.
    let oldest = days;
    while (oldest > 0 && Object.values(balances[oldest]).some((b) => b < BALANCE_FLOOR))
        oldest--;
    const out = [];
    for (let k = oldest; k >= 1; k--) {
        const openedAt = bounds[k];
        const closedAt = bounds[k - 1];
        const opening = balances[k];
        const closing = balances[k - 1];
        let earnedUsd = 0;
        let usd = 0;
        let capitalUsd = 0;
        for (const mint of mints) {
            const before = (0, portfolio_history_1.priceAt)(prices[mint] ?? [], openedAt);
            const after = (0, portfolio_history_1.priceAt)(prices[mint] ?? [], closedAt);
            const held = opening[mint] ?? 0;
            earnedUsd += held * (after - before);
            capitalUsd += held * before;
            usd += (closing[mint] ?? 0) * after;
        }
        let inUsd = 0;
        let outUsd = 0;
        for (const tx of perInterval[k] ?? []) {
            let value = 0;
            let received = false;
            let sent = false;
            for (const [mint, delta] of Object.entries(tx.legs)) {
                if (delta > 0)
                    received = true;
                else if (delta < 0)
                    sent = true;
                value += delta * (0, portfolio_history_1.priceAt)(prices[mint] ?? [], closedAt);
            }
            if (received && sent) {
                // One thing you own became another. Nothing entered or left; what the exchange
                // cost — spread, fee, a bad fill — is the whole of its value change.
                earnedUsd += value;
            }
            else {
                if (value > 0)
                    inUsd += value;
                else
                    outUsd += -value;
                capitalUsd += value * ((closedAt - tx.timestamp) / DAY);
            }
        }
        out.push({ t: closedAt, usd: (0, portfolio_history_1.isDustUsd)(usd) ? 0 : usd, earnedUsd, inUsd, outUsd, capitalUsd });
    }
    return out;
}
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
        return { startUsd: null, endUsd: null, earnedUsd: null, returnPct: null, inUsd: 0, outUsd: 0 };
    }
    let earnedUsd = 0;
    let inUsd = 0;
    let outUsd = 0;
    let growth = 1;
    let measured = false;
    for (const d of days) {
        earnedUsd += d.earnedUsd;
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
        returnPct: measured ? growth - 1 : null,
        inUsd,
        outUsd,
    };
}
