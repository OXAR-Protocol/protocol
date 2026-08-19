"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_CONVERT_USD = void 0;
exports.convertibleAssets = convertibleAssets;
exports.convertibleUsd = convertibleUsd;
exports.planTopUp = planTopUp;
const assets_1 = require("./assets");
/**
 * Paying for a basket with money that isn't dollars yet.
 *
 * Buying settles in USDC. Anything else in the wallet — SOL, USDT, a stray token —
 * is money the person has and cannot spend, and the app used to answer that by
 * sending them to a separate "turn this into dollars" screen and back. That is our
 * plumbing showing through: the wallet holds $40, the basket costs $30, and the
 * answer was "you have $0 to spend".
 *
 * So the gap gets covered on the way through, from the biggest holding down. It is
 * still a trade and it still costs something, which is why this only PLANS it — the
 * caller shows the plan before anything is signed.
 */
/** Under this, the swap's own costs eat the conversion. Not worth doing. */
exports.MIN_CONVERT_USD = 0.5;
/** A swap lands at or under its quote (slippage, fees), so ask for slightly more
 *  than the gap — coming up two cents short would fail the last purchase. */
const MARGIN = 1.02;
/** Everything that could become dollars, biggest first. Dust is left alone. */
function convertibleAssets(assets, usdcMint) {
    return assets
        .filter((a) => a.mint !== usdcMint && (0, assets_1.spendableUsd)(a) >= exports.MIN_CONVERT_USD)
        .sort((a, b) => (0, assets_1.spendableUsd)(b) - (0, assets_1.spendableUsd)(a));
}
/** What the wallet holds beyond dollars, valued in dollars. */
function convertibleUsd(assets, usdcMint) {
    return convertibleAssets(assets, usdcMint).reduce((sum, a) => sum + (0, assets_1.spendableUsd)(a), 0);
}
/**
 * Which coins to convert, and how much of each, to cover `shortfallUsd`.
 *
 * Biggest first, so the usual case is ONE swap: several small conversions pay the
 * fixed cost of a swap several times and price worse than one order of the same size.
 */
function planTopUp(assets, shortfallUsd, usdcMint) {
    if (shortfallUsd <= 0)
        return [];
    let left = shortfallUsd * MARGIN;
    const legs = [];
    for (const asset of convertibleAssets(assets, usdcMint)) {
        if (left <= 0)
            break;
        const available = (0, assets_1.spendableUsd)(asset);
        // Never below the floor — a two-cent swap is all fee — and never the whole
        // holding to cover two cents either. The floor, or the gap, whichever is bigger.
        const usd = Math.min(available, Math.max(left, exports.MIN_CONVERT_USD));
        legs.push({ asset, usd });
        left -= usd;
    }
    return legs;
}
