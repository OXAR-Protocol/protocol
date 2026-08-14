"use strict";
/**
 * Delora cross-chain bridge+swap quote types and pure helpers. The actual quote
 * call goes through the server route `/api/bridge-quote` (the Delora key is
 * server-only). These helpers build the request and read the response.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELORA_SOLANA_CHAIN_ID = void 0;
exports.bridgeFeeUsd = bridgeFeeUsd;
exports.bridgeFeeTooHigh = bridgeFeeTooHigh;
/** Delora's synthetic chain id for Solana (the bridge destination). */
exports.DELORA_SOLANA_CHAIN_ID = 1000000001;
/** Max share of the deposit we let bridge fees consume before blocking. */
const FEE_CAP_FRACTION = 0.3;
/** Total bridge fee in USD (sum of the breakdown). */
function bridgeFeeUsd(quote) {
    return (quote.fees?.breakdown ?? []).reduce((sum, f) => sum + (Number(f.amountUsd) || 0), 0);
}
/** Block when fees eat more than FEE_CAP_FRACTION of the deposit. */
function bridgeFeeTooHigh(quote, depositUsd) {
    if (depositUsd <= 0)
        return true;
    return bridgeFeeUsd(quote) > FEE_CAP_FRACTION * depositUsd;
}
