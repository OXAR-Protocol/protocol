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
  readonly baseApy: number; // % current rate
  readonly riskLevel: RiskLevel;
  readonly viaDelora: boolean; // true if accessed via cross-chain bridge
  readonly available: boolean; // false = roadmap, not yet integrated
}

export const YIELD_SOURCES: readonly YieldSourceConfig[] = [
  // Foundation — Solana-native
  {
    id: "kamino-usdc",
    name: "Kamino USDC",
    description: "USDC lending on Solana",
    chain: "solana",
    baseApy: 5.5,
    riskLevel: "low",
    viaDelora: false,
    available: false,
  },
  {
    id: "marginfi-usdc",
    name: "MarginFi USDC",
    description: "USDC lending alternative to Kamino",
    chain: "solana",
    baseApy: 4.5,
    riskLevel: "low",
    viaDelora: false,
    available: false,
  },
  {
    id: "jlp",
    name: "Jupiter LP",
    description: "Jupiter Perps liquidity provider token",
    chain: "solana",
    baseApy: 9.5,
    riskLevel: "medium",
    viaDelora: false,
    available: false,
  },
  {
    id: "maple-solana",
    name: "Maple Syrup USDC",
    description: "Institutional credit on Solana",
    chain: "solana",
    baseApy: 7.5,
    riskLevel: "medium",
    viaDelora: false,
    available: false,
  },
  {
    id: "drift-insurance",
    name: "Drift Insurance Fund",
    description: "Backstop liquidity for Drift Perps",
    chain: "solana",
    baseApy: 10.0,
    riskLevel: "medium",
    viaDelora: false,
    available: false,
  },
  // RWA Treasuries — облигации США через Delora cross-chain
  // (Ondo USDY is now LIVE natively on Solana — see web yield provider
  //  `lib/yield/ondo.ts`; it lists under "Live now", not the roadmap.)
  {
    id: "mountain-usdm",
    name: "Mountain USDM",
    description: "Retail-regulated US Treasuries (Bermuda)",
    chain: "ethereum",
    baseApy: 5.0,
    riskLevel: "low",
    viaDelora: true,
    available: false,
  },
  {
    id: "openeden-tbill",
    name: "OpenEden TBILL",
    description: "Institutional T-Bills with daily NAV",
    chain: "ethereum",
    baseApy: 5.2,
    riskLevel: "low",
    viaDelora: true,
    available: false,
  },
  // Stable / advanced DeFi yields
  {
    id: "sky-sdai",
    name: "Sky sDAI",
    description: "Sky (formerly Maker) savings rate",
    chain: "ethereum",
    baseApy: 6.5,
    riskLevel: "low",
    viaDelora: true,
    available: false,
  },
  {
    id: "ethena-susde",
    name: "Ethena sUSDe",
    description: "Delta-neutral stablecoin yield (advanced)",
    chain: "ethereum",
    baseApy: 11.0,
    riskLevel: "high",
    viaDelora: true,
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
