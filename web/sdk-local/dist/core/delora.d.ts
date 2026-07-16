/**
 * Delora cross-chain bridge+swap quote types and pure helpers. The actual quote
 * call goes through the server route `/api/bridge-quote` (the Delora key is
 * server-only). These helpers build the request and read the response.
 */
/** Delora's synthetic chain id for Solana (the bridge destination). */
export declare const DELORA_SOLANA_CHAIN_ID = 1000000001;
export declare function networkToChainId(network: string): number | null;
export interface BridgeQuote {
    inputAmount: string;
    outputAmount: string;
    /** Guaranteed-min USDC out (after slippage) — what we deposit on arrival. */
    minOutputAmount: string;
    estimatedTimeSec: number;
    adapter: string;
    /** Executable EVM transaction. */
    calldata: {
        to: string;
        value: string;
        data: string;
    };
    /** ERC-20 spender to approve before bridging (the Delora diamond). */
    approvalAddress?: string;
    fees?: {
        breakdown?: Array<{
            type?: string;
            amountUsd?: string;
        }>;
    };
    /** Optional tracking URL Delora returns for the in-flight transfer. */
    bridgeScan?: string;
    warnings?: Array<{
        code?: string;
        message?: string;
    }>;
}
/** Total bridge fee in USD (sum of the breakdown). */
export declare function bridgeFeeUsd(quote: BridgeQuote): number;
/** Block when fees eat more than FEE_CAP_FRACTION of the deposit. */
export declare function bridgeFeeTooHigh(quote: BridgeQuote, depositUsd: number): boolean;
/** Guaranteed-min USDC out, in base units. */
export declare function bridgeNetOut(quote: BridgeQuote): bigint;
export interface QuoteRequest {
    senderAddress: string;
    originChainId: number;
    destinationChainId: number;
    amount: string;
    originCurrency: string;
    destinationCurrency: string;
    receiverAddress: string;
}
/** Build the (server-route) quote request for an EVM → Solana bridge. The
 * destination is the selected market's asset (USDC / USDG / USDT), not hardcoded. */
export declare function buildQuoteRequest(params: {
    senderAddress: string;
    originChainId: number;
    amount: bigint;
    originCurrency: string;
    receiverAddress: string;
    destinationMint: string;
}): QuoteRequest;
