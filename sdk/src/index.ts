// ============================================================================
// Constants
// ============================================================================
export {
  PROGRAM_ID,
  RPC_URL,
  INITIAL_NAV,
  USDC_DECIMALS,
  NAV_PRECISION,
  YIELD_SOURCES,
  APY_BUCKETS,
  getYieldSourceById,
  vaultIdForYieldSource,
} from "./constants";

export type { YieldSourceConfig, ApyBucket, ApyBucketConfig } from "./constants";

// ============================================================================
// IDL + types
// ============================================================================
export { default as IDL } from "./idl.json";
export type { OxarProtocol } from "./types";

// ============================================================================
// PDA derivation
// ============================================================================
export {
  derivePersonalVaultPda,
  deriveGroupVaultPda,
  deriveGroupMemberPda,
  deriveRulePda,
  deriveMintPda,
  derivePoolPda,
} from "./pda";

// ============================================================================
// Core money-path logic (framework-agnostic — shared by web + mobile)
// ============================================================================
export { buildKoraLegacyTx, rebuildV0WithKora } from "./core/kora-tx";
