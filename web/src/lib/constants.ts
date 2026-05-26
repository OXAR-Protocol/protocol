// Re-export shared constants from SDK
export {
  PROGRAM_ID,
  YIELD_SOURCES,
  RISK_TEMPLATES,
  getYieldSourceById,
} from "@oxar/sdk";
export type { YieldSourceConfig, RiskTemplate } from "@oxar/sdk";

// Web-specific: RPC URL from environment. Falls back to public devnet (rate-limited, no secrets).
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Devnet USDC mint address (single source of truth)
export const CURRENT_USDC_MINT = "HucyHTk4qVJ7JhwsiNNCz9FNGNeDDN38y5KaKjeBYgNR";
