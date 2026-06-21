import { PublicKey } from "@solana/web3.js";

// ============================================================================
// Program
// ============================================================================

export const PROGRAM_ID = new PublicKey(
  "8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ"
);

export const RPC_URL = "https://api.devnet.solana.com";

// ============================================================================
// Math constants (mirror of contracts/.../constants.rs)
// ============================================================================

export const INITIAL_NAV = 1_000_000;
export const NAV_PRECISION = 1_000_000;
export const USDC_DECIMALS = 6;

// ============================================================================
// Yield source catalog (Solana-native + Delora cross-chain)
// ============================================================================

type RiskLevel = "low" | "medium" | "high";
type Chain = "solana" | "ethereum";

export interface YieldSourceConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly chain: Chain;
  readonly baseApy: number; // % current rate (single figure used for filtering)
  readonly apyLabel?: string; // optional display override, e.g. a range "4–16%"
  readonly riskLevel: RiskLevel;
  readonly viaDelora: boolean; // true if accessed via cross-chain bridge
  readonly available: boolean; // false = roadmap, not yet integrated
}

export const YIELD_SOURCES: readonly YieldSourceConfig[] = [
  // The roadmap headline: tokenized Ukrainian government bonds (OVDP).
  {
    id: "ukraine-gov-bonds",
    name: "Ukrainian Gov Bonds",
    description: "Tokenized Ukrainian government bonds (OVDP) — sovereign-backed, USD & UAH terms.",
    chain: "solana",
    baseApy: 16,
    apyLabel: "4–16%",
    riskLevel: "low",
    viaDelora: false,
    available: false,
  },
];

// ============================================================================
// APY filter buckets — UI chips on /yield marketplace
// ============================================================================

export type ApyBucket = "sleepy" | "walking" | "running";

export interface ApyBucketConfig {
  readonly id: ApyBucket;
  readonly label: string;
  readonly emoji: string;
  readonly description: string;
  /** Returns true if a yield source falls into this bucket by APY. */
  readonly matches: (apy: number) => boolean;
}

export const APY_BUCKETS: readonly ApyBucketConfig[] = [
  {
    id: "sleepy",
    label: "Sleepy",
    emoji: "😴",
    description: "low APY · low risk",
    matches: (apy) => apy < 6,
  },
  {
    id: "walking",
    label: "Walking",
    emoji: "🚶",
    description: "balanced APY",
    matches: (apy) => apy >= 6 && apy < 9,
  },
  {
    id: "running",
    label: "Running",
    emoji: "🏃",
    description: "high APY · loud risk",
    matches: (apy) => apy >= 9,
  },
];

export function getYieldSourceById(id: string): YieldSourceConfig | undefined {
  return YIELD_SOURCES.find((s) => s.id === id);
}

/** Stable vault_id derived from yield-source id. Used for vault PDA. */
export function vaultIdForYieldSource(yieldSourceId: string): bigint {
  let hash = 5381n;
  for (let i = 0; i < yieldSourceId.length; i++) {
    hash = ((hash << 5n) + hash + BigInt(yieldSourceId.charCodeAt(i))) & 0xffffffffffffffffn;
  }
  return hash;
}
