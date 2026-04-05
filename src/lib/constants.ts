// Re-export shared constants from SDK
export { PROGRAM_ID, VAULT_CONFIGS, getVaultConfigById, parseVaultId } from "@oxar/sdk";
export type { VaultConfig } from "@oxar/sdk";

// Web-specific: RPC URL from environment
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://devnet.helius-rpc.com/?api-key=0803f982-c361-4a2a-8496-1391a4b38672";

// Devnet USDC mint address (single source of truth)
export const CURRENT_USDC_MINT = "HucyHTk4qVJ7JhwsiNNCz9FNGNeDDN38y5KaKjeBYgNR";
