"use strict";
/**
 * Judging a swap quote by what it actually delivers.
 *
 * Jupiter's `priceImpactPct` is not trustworthy on thin tokens, in BOTH directions:
 * a GLDx sell reported 2.219% impact while returning 99.8% of the position's value,
 * and an AVGOx buy reported 1.988% while handing over 2.5% fewer tokens than the
 * reference price implies. Anything that gates a user's trade on that percentage can
 * therefore refuse a perfectly good trade, or wave through a bad one.
 *
 * So compare VALUE IN against VALUE OUT, using the quote's own `inAmount` /
 * `outAmount` and the reference prices we already fetch for display. The reference
 * price is only a yardstick here — the amounts are real.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_QUOTE_DELIVERY = void 0;
exports.quoteDeliveryRatio = quoteDeliveryRatio;
exports.marketLooksBroken = marketLooksBroken;
/** Below this share of the value put in, a quote is a broken route, not a dear one. */
exports.MIN_QUOTE_DELIVERY = 0.9;
/**
 * Value out ÷ value in (1 = the reference price exactly; 0.98 = 2% worse).
 * `null` when a reference price is missing — the caller must NOT read that as bad,
 * only as unknown.
 */
function quoteDeliveryRatio(p) {
    if (!(p.inPriceUsd > 0) || !(p.outPriceUsd > 0))
        return null;
    const inUsd = (Number(p.inAmount) / 10 ** p.inDecimals) * p.inPriceUsd;
    const outUsd = (Number(p.outAmount) / 10 ** p.outDecimals) * p.outPriceUsd;
    if (!(inUsd > 0) || !Number.isFinite(outUsd))
        return null;
    return outUsd / inUsd;
}
/**
 * True only when the quote loses so much value that the route must be broken —
 * a dried-up pool, a bad hop, a stale mint. An expensive-but-real trade is NOT
 * broken: the cost is shown before signing and the choice is the user's.
 *
 * Unknown (missing reference price) is never "broken" — we don't block a trade
 * because a price feed is down; the wallet still sees the quote and the swap
 * carries its own on-chain slippage limit.
 */
function marketLooksBroken(ratio) {
    return ratio !== null && ratio < exports.MIN_QUOTE_DELIVERY;
}
