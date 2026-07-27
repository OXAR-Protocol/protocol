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
/** Below this share of the value put in, a quote is a broken route, not a dear one. */
export declare const MIN_QUOTE_DELIVERY = 0.9;
export interface QuoteValueParams {
    inAmount: bigint;
    outAmount: bigint;
    inDecimals: number;
    outDecimals: number;
    /** USD per whole unit of the input token (USDC ≈ 1). */
    inPriceUsd: number;
    /** USD per whole unit of the output token. */
    outPriceUsd: number;
}
/**
 * Value out ÷ value in (1 = the reference price exactly; 0.98 = 2% worse).
 * `null` when a reference price is missing — the caller must NOT read that as bad,
 * only as unknown.
 */
export declare function quoteDeliveryRatio(p: QuoteValueParams): number | null;
/**
 * True only when the quote loses so much value that the route must be broken —
 * a dried-up pool, a bad hop, a stale mint. An expensive-but-real trade is NOT
 * broken: the cost is shown before signing and the choice is the user's.
 *
 * Unknown (missing reference price) is never "broken" — we don't block a trade
 * because a price feed is down; the wallet still sees the quote and the swap
 * carries its own on-chain slippage limit.
 */
export declare function marketLooksBroken(ratio: number | null): boolean;
