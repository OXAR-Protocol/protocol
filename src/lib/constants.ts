// Re-export shared constants from SDK
export { PROGRAM_ID, VAULT_CONFIGS, getVaultConfigById, parseVaultId } from "@oxar/sdk";
export type { VaultConfig } from "@oxar/sdk";

// Web-specific: RPC URL from environment
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
