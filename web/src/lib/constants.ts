// Re-export the yield-source catalog from the SDK (the only part v1 consumes).
export { YIELD_SOURCES, APY_BUCKETS } from "@oxar/sdk";
export type { YieldSourceConfig, ApyBucket, ApyBucketConfig } from "@oxar/sdk";

// Web-specific: RPC URL from environment.
// v1 (SDK-frontend) talks to MAINNET — Kamino / Jupiter Lend only exist there.
// Set NEXT_PUBLIC_SOLANA_RPC_URL to a mainnet (Helius) endpoint in Vercel.
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Mainnet USDC mint — the asset all v1 yield providers accept.
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DECIMALS = 6;

/**
 * The USDC token account that receives our swap fee. Empty = we take nothing, which
 * is the shipped state: the machinery exists, the switch is off, and no user pays
 * anything until both this and the `platform-fee` flag are set.
 *
 * A token account, not a wallet — Jupiter pays the fee into an SPL account, and its
 * mint must be one side of the swap, which is why we only ever take it in USDC.
 * Deliberately NOT the admin wallet: project income and operational keys shouldn't
 * share an address.
 */
export const FEE_ACCOUNT_USDC = process.env.NEXT_PUBLIC_FEE_ACCOUNT_USDC ?? "";
