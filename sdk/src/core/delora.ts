/**
 * Delora cross-chain bridge+swap quote types and pure helpers. The actual quote
 * call goes through the server route `/api/bridge-quote` (the Delora key is
 * server-only). These helpers build the request and read the response.
 */

/** Delora's synthetic chain id for Solana (the bridge destination). */
export const DELORA_SOLANA_CHAIN_ID = 1_000_000_001;

/** Max share of the deposit we let bridge fees consume before blocking. */
const FEE_CAP_FRACTION = 0.3;

/** Alchemy network id → Delora numeric EVM chain id (our supported set). */
const NETWORK_CHAIN_ID: Record<string, number> = {
  "eth-mainnet": 1,
  "opt-mainnet": 10,
  "matic-mainnet": 137,
  "base-mainnet": 8453,
  "arb-mainnet": 42161,
};

export function networkToChainId(network: string): number | null {
  return NETWORK_CHAIN_ID[network] ?? null;
}

export interface BridgeQuote {
  inputAmount: string;
  outputAmount: string;
  /** Guaranteed-min USDC out (after slippage) — what we deposit on arrival. */
  minOutputAmount: string;
  estimatedTimeSec: number;
  adapter: string;
  /** Executable EVM transaction. */
  calldata: { to: string; value: string; data: string };
  /** ERC-20 spender to approve before bridging (the Delora diamond). */
  approvalAddress?: string;
  fees?: { breakdown?: Array<{ type?: string; amountUsd?: string }> };
  /** Optional tracking URL Delora returns for the in-flight transfer. */
  bridgeScan?: string;
  warnings?: Array<{ code?: string; message?: string }>;
}

/** Total bridge fee in USD (sum of the breakdown). */
export function bridgeFeeUsd(quote: BridgeQuote): number {
  return (quote.fees?.breakdown ?? []).reduce(
    (sum, f) => sum + (Number(f.amountUsd) || 0),
    0,
  );
}

/** Block when fees eat more than FEE_CAP_FRACTION of the deposit. */
export function bridgeFeeTooHigh(quote: BridgeQuote, depositUsd: number): boolean {
  if (depositUsd <= 0) return true;
  return bridgeFeeUsd(quote) > FEE_CAP_FRACTION * depositUsd;
}

/** Guaranteed-min USDC out, in base units. */
export function bridgeNetOut(quote: BridgeQuote): bigint {
  return BigInt(quote.minOutputAmount);
}

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
export function buildQuoteRequest(params: {
  senderAddress: string;
  originChainId: number;
  amount: bigint;
  originCurrency: string;
  receiverAddress: string;
  destinationMint: string;
}): QuoteRequest {
  return {
    senderAddress: params.senderAddress,
    originChainId: params.originChainId,
    destinationChainId: DELORA_SOLANA_CHAIN_ID,
    amount: params.amount.toString(),
    originCurrency: params.originCurrency,
    destinationCurrency: params.destinationMint,
    receiverAddress: params.receiverAddress,
  };
}
