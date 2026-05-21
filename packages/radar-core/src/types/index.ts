export type Chain = "ethereum" | "solana";

export type ProtocolCategory =
  | "us-treasuries"
  | "private-credit"
  | "money-market"
  | "emerging-markets"
  | "other";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ProtocolMetadata {
  slug: string;
  name: string;
  chain: Chain;
  category: ProtocolCategory;
  contractAddress: string;
  decimals: number;
  description: string;
  issuerName: string;
  issuerJurisdiction?: string;
  websiteUrl: string;
  /** Estimated APY in basis points. Hardcoded in v0.1, indexer-driven in Phase 2. */
  estimatedApyBps: number;
}

export interface ProtocolSnapshot {
  protocolSlug: string;
  timestamp: number;
  nav: number;
  tvl: number;
  holderCount: number;
  apyBps: number;
  top10ConcentrationPct: number;
  redemptionQueueSize?: number;
}

export interface WalletPosition {
  protocolSlug: string;
  protocolName: string;
  chain: Chain;
  balance: number;
  valueUsd: number;
  yieldApyBps: number;
}

export interface RiskScore {
  overall: number;
  counterpartyRisk: RiskLevel;
  concentrationRisk: RiskLevel;
  smartContractRisk: RiskLevel;
  liquidityRisk: RiskLevel;
}

export interface WalletAnalysis {
  walletAddress: string;
  chains: Chain[];
  totalValueUsd: number;
  positions: WalletPosition[];
  riskScore: RiskScore;
  concentrationByProtocol: Record<string, number>;
  concentrationByChain: Record<Chain, number>;
  weightedApyBps: number;
  analyzedAt: number;
}

export interface ExplainOutput {
  summary: string;
  risks: string;
  recommendations: string;
  language: "en" | "ru" | "pl";
}
