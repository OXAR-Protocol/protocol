import { PublicKey } from "@solana/web3.js";

/// Per-source identifier embedded in the on-chain `YieldSource::DeloraCrossChain { source_id }`.
/// Must stay in sync with `web/src/hooks/use-vault-actions.ts crossChainSourceId()`.
export const CROSS_CHAIN_SOURCES = {
  1: { id: "ondo-usdy", chain: "ethereum", token: "USDY" },
  2: { id: "ethena-susde", chain: "ethereum", token: "sUSDe" },
  3: { id: "sky-sdai", chain: "ethereum", token: "sDAI" },
  4: { id: "mountain-usdm", chain: "ethereum", token: "USDM" },
  5: { id: "openeden-tbill", chain: "ethereum", token: "TBILL" },
} as const;

export type CrossChainSourceId = keyof typeof CROSS_CHAIN_SOURCES;

export interface TrackedVault {
  pda: PublicKey;
  authority: PublicKey;
  vaultId: bigint;
  sourceId: CrossChainSourceId;
  coldCapital: bigint; // current USDC routed cross-chain (lamports)
  totalShares: bigint;
  navPerShare: bigint; // last on-chain NAV (NAV_PRECISION = 1_000_000)
}

export interface NavQuote {
  sourceId: CrossChainSourceId;
  /// Live USD value of 1 share worth of cold capital, in NAV_PRECISION units.
  /// Computed off-chain from Delora settlement state + token oracle.
  navPerShare: bigint;
  /// Snapshot timestamp (server-side) for audit.
  asOf: number;
}
