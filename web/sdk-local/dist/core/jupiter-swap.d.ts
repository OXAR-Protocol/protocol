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
