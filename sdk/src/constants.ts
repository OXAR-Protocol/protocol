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
  {
    id: "kamino-usdc",
    name: "Kamino USDC",
    description: "USDC lending on Solana",
    chain: "solana",
    baseApy: 5.5,
    riskLevel: "low",
    viaDelora: false,
    available: false, // wired up in Phase D
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
    id: "ondo-usdy",
    name: "Ondo USDY",
    description: "Tokenized US Treasuries (cross-chain via Delora)",
    chain: "ethereum",
    baseApy: 5.0,
    riskLevel: "low",
    viaDelora: true,
    available: false,
  },
  {
    id: "ethena-susde",
    name: "Ethena sUSDe",
    description: "DeFi stablecoin yield (cross-chain via Delora)",
    chain: "ethereum",
    baseApy: 11.0,
    riskLevel: "high",
    viaDelora: true,
    available: false,
  },
  {
    id: "sky-sdai",
    name: "Sky sDAI",
    description: "Sky savings rate (cross-chain via Delora)",
    chain: "ethereum",
    baseApy: 6.5,
    riskLevel: "low",
    viaDelora: true,
    available: false,
  },
];

// ============================================================================
// Risk templates — opinionated allocations
// ============================================================================

export type RiskTemplate = "conservative" | "balanced" | "aggressive";

export const RISK_TEMPLATES: Record<
  RiskTemplate,
  {
    readonly label: string;
    readonly emoji: string;
    readonly description: string;
    readonly targetApy: number;
    readonly sources: readonly string[]; // yield source IDs
  }
> = {
  conservative: {
    label: "Sleepy",
    emoji: "😴",
    description: "Slow but steady",
    targetApy: 5,
    sources: ["kamino-usdc", "ondo-usdy"],
  },
  balanced: {
    label: "Walking",
    emoji: "🚶",
    description: "Balanced pace",
    targetApy: 7,
    sources: ["kamino-usdc", "maple-solana", "jlp"],
  },
  aggressive: {
    label: "Running",
    emoji: "🏃",
    description: "Fast & loud",
    targetApy: 10,
    sources: ["jlp", "ethena-susde"],
  },
};

export function getYieldSourceById(id: string): YieldSourceConfig | undefined {
  return YIELD_SOURCES.find((s) => s.id === id);
}
