import { type WalletAsset } from "./assets";
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
export declare const MIN_CONVERT_USD = 0.5;
export interface TopUpLeg {
    asset: WalletAsset;
    /** Dollars to take out of this asset. */
    usd: number;
}
/** Everything that could become dollars, biggest first. Dust is left alone. */
export declare function convertibleAssets(assets: readonly WalletAsset[], usdcMint: string): WalletAsset[];
/** What the wallet holds beyond dollars, valued in dollars. */
export declare function convertibleUsd(assets: readonly WalletAsset[], usdcMint: string): number;
/**
 * Which coins to convert, and how much of each, to cover `shortfallUsd`.
 *
 * Biggest first, so the usual case is ONE swap: several small conversions pay the
 * fixed cost of a swap several times and price worse than one order of the same size.
 */
export declare function planTopUp(assets: readonly WalletAsset[], shortfallUsd: number, usdcMint: string): TopUpLeg[];
