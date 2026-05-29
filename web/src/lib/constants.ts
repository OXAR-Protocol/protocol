// Re-export shared constants from SDK
export {
  PROGRAM_ID,
  YIELD_SOURCES,
  APY_BUCKETS,
  getYieldSourceById,
  vaultIdForYieldSource,
} from "@oxar/sdk";
export type { YieldSourceConfig, ApyBucket, ApyBucketConfig } from "@oxar/sdk";

// Web-specific: RPC URL from environment.
// v1 (SDK-frontend) talks to MAINNET — Kamino / Jupiter Lend only exist there.
// Set NEXT_PUBLIC_SOLANA_RPC_URL to a mainnet (Helius) endpoint in Vercel.
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// Mainnet USDC mint — the asset all v1 yield providers accept.
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DECIMALS = 6;

// Legacy alias (devnet contract era) — kept until callers migrate to USDC_MINT.
export const CURRENT_USDC_MINT = USDC_MINT;
