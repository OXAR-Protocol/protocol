"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceAt = priceAt;
exports.dailyPortfolioValue = dailyPortfolioValue;
exports.trimLeadingEmpty = trimLeadingEmpty;
const DAY = 86400;
/** Price at or before `t`; the earliest known price before the series starts, so a
 *  position that predates our price data is valued rather than silently dropped. */
function priceAt(series, t) {
    if (!series.length)
        return 0;
    let chosen = series[0].price;
    for (const p of series) {
        if (p.t > t)
            break;
        chosen = p.price;
    }
    return chosen;
}
/**
 * Daily portfolio value for the last `days`, oldest first.
 *
 * A day's value uses the balance as of the END of that day, so a purchase shows up
 * on the day it happened rather than the next one.
 */
function dailyPortfolioValue(params) {
    const { now, days, balancesNow, deltas, prices } = params;
    const points = [];
    const mints = new Set([...Object.keys(balancesNow), ...deltas.map((d) => d.mint)]);
    for (let i = days - 1; i >= 0; i--) {
        const dayEnd = now - i * DAY;
        let usd = 0;
        for (const mint of mints) {
            // Balance at dayEnd = balance now, minus everything that moved after it.
            let amount = balancesNow[mint] ?? 0;
            for (const d of deltas) {
                if (d.mint === mint && d.timestamp > dayEnd)
                    amount -= d.delta;
            }
            // Floating error and truncated history can both push this slightly negative;
            // a negative holding is not a thing, and would drag the whole line down.
            if (amount <= 0)
                continue;
            usd += amount * priceAt(prices[mint] ?? [], dayEnd);
        }
        points.push({ t: dayEnd, usd });
    }
    return points;
}
/**
 * Drop the flat run at the start — the days before this wallet held anything.
 * A chart that opens with a month of zeros says nothing and squashes the part that
 * does. Keeps one zero so the first deposit still reads as a rise from nothing.
 */
function trimLeadingEmpty(points) {
    const firstHeld = points.findIndex((p) => p.usd > 0);
    if (firstHeld < 0)
        return [];
    return points.slice(Math.max(0, firstHeld - 1));
}
