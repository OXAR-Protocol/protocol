"use strict";
/**
 * What is held right now, in dollars — the stock beside the flow.
 *
 * Volume answers "how much moved through us"; on its own it is ambiguous in the way
 * that matters most. A thousand dollars of volume is a thousand dollars that arrived
 * and stayed, or a hundred dollars that went in and out five times, and for a yield
 * product those are opposite outcomes. Only the balance can tell them apart.
 *
 * Deliberately NOT derived from the flows. Adding up deposits and subtracting
 * withdrawals gives the money put in at the price it was put in at, which is not what
 * anybody holds: it ignores every dollar the position has earned since. Reading the
 * balance and pricing it today includes the yield, because the yield is IN the
 * balance — a Jupiter Lend receipt token accrues in its price rather than in units.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.valueHoldings = valueHoldings;
exports.totalAum = totalAum;
/** Dust: a balance this small is a closed position's residue, not a holding. */
const DUST_USD = 0.01;
function valueHoldings(balances, prices) {
    const holdings = [];
    const unpriced = [];
    let totalUsd = 0;
    for (const [mint, amount] of Object.entries(balances)) {
        if (!(amount > 0))
            continue;
        const price = prices[mint];
        if (typeof price !== "number" || !isFinite(price) || price <= 0) {
            unpriced.push(mint);
            continue;
        }
        const usd = amount * price;
        if (usd < DUST_USD)
            continue;
        holdings.push({ mint, amount, price, usd });
        totalUsd += usd;
    }
    holdings.sort((a, b) => b.usd - a.usd);
    return { holdings, totalUsd, unpriced };
}
/** Roll per-wallet valuations into the one figure and its breakdown. */
function totalAum(valuations) {
    const byMint = {};
    const unpriced = new Set();
    let totalUsd = 0;
    let wallets = 0;
    for (const v of valuations) {
        if (v.totalUsd > 0)
            wallets += 1;
        totalUsd += v.totalUsd;
        for (const h of v.holdings)
            byMint[h.mint] = (byMint[h.mint] ?? 0) + h.usd;
        for (const m of v.unpriced)
            unpriced.add(m);
    }
    return { totalUsd, wallets, byMint, unpriced: [...unpriced] };
}
