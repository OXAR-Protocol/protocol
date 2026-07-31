"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDustUsd = isDustUsd;
exports.priceAt = priceAt;
/** Below half a cent a portfolio is worth nothing that survives display rounding.
 *  The backward replay leaves float residue (~1e-13 dollars) on the days before the
 *  first trade; letting it through reads as "held almost nothing" instead of
 *  "held nothing", and a range that starts there divides by it. One predicate rather
 *  than an exported constant, so every "is this worth anything" guard agrees by
 *  construction instead of by hand-kept-in-sync inequalities. */
const DUST_USD = 0.005;
function isDustUsd(usd) {
    return usd < DUST_USD;
}
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
