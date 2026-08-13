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
export * from "./core/units";
export * from "./core/fetch-retry";
export * from "./core/evm-assets";
export * from "./core/assets";
export * from "./core/delora";
export * from "./core/paybis";
export * from "./core/card-coverage";
export * from "./core/wallet-deltas";
export * from "./core/jupiter-swap";
export * from "./core/earnings-basis";
export * from "./core/features";
export * from "./core/quote-value";
export * from "./core/exit-cost";
export * from "./core/tx-delta";
export * from "./core/format";
export * from "./core/allocations";
export * from "./core/origin-gas";
export * from "./core/activity-stats";
export * from "./core/format-date";
export * from "./core/portfolio-history";
export * from "./core/portfolio-performance";
export * from "./core/portfolio-summary";
export * from "./core/tracked-mints";
export * from "./core/poll-arrival";
export * from "./core/terms";
export * from "./core/feedback";
export * from "./core/market-sort";
