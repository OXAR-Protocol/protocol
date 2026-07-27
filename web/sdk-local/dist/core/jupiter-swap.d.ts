/**
 * Jupiter swap (in-Solana) for the deposit router: quote an exact-in swap of any
 * SPL/SOL into USDC, then build the swap transaction. The wallet signs+sends it;
 * the router then deposits the realized USDC.
 *
 * `asLegacy`: build a LEGACY (non-versioned) transaction. External wallets
 * (Phantom/Trust, esp. mobile) mishandle Jupiter's default v0 tx and broadcast
 * malformed bytes ("failed to deserialize VersionedTransaction"); legacy txs are
 * universally signable. The embedded wallet keeps v0 (better routing, no size cap).
 */
import { Transaction, VersionedTransaction } from "@solana/web3.js";
export interface SwapQuote {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    /** Min out after slippage — guaranteed available, so deposit this (leaves dust). */
    otherAmountThreshold: string;
    priceImpactPct: string;
    slippageBps: number;
    swapMode: string;
}
/** Price impact as a fraction (0.01 = 1%). */
export declare function swapPriceImpact(quote: SwapQuote): number;
/** True if the swap's price impact exceeds the cap (default 1.5%). */
export declare function priceImpactTooHigh(quote: SwapQuote, maxFraction?: number): boolean;
/**
 * Sanity stop for trading a HELD asset (stocks, gold, swap-and-hold yield): at this
 * level the quote isn't expensive, it's broken — a dried-up pool or a bad route —
 * and the fill wouldn't resemble the value we showed the user.
 *
 * Far above the 1.5% default, and deliberately so. What a trade costs is the user's
 * call, and the UI now shows it before they sign; blocking on cost instead LOCKED
 * HOLDERS IN, because on a thin market a sell costs ~2% at every size, so the
 * "try a smaller amount" advice couldn't work. Relaxing it is cheap: on liquid
 * tickers impact is ~0.02%, so this never fires for them.
 */
export declare const BROKEN_MARKET_IMPACT = 0.1;
/** Quote an exact-in swap `inputMint → outputMint` for `amount` (base units). */
export declare function getSwapQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: bigint;
    slippageBps?: number;
    /** Constrain the route so it fits a legacy transaction (for external wallets). */
    asLegacy?: boolean;
}): Promise<SwapQuote>;
/** Build the swap transaction (base64) for a quote + owner. v0 by default; legacy when asked. */
export declare function buildSwapTx(quote: SwapQuote, ownerBase58: string, opts?: {
    asLegacy?: boolean;
}): Promise<string>;
/** Deserialize Jupiter's base64 swap tx — legacy `Transaction` or v0 `VersionedTransaction`. */
export declare function deserializeSwapTx(b64: string, asLegacy: boolean): Transaction | VersionedTransaction;
