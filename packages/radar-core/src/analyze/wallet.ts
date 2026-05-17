import type { ChainAdapter } from "../chains/types";
import { getProtocolsByChain } from "../protocols/registry";
import type {
  Chain,
  RiskScore,
  WalletAnalysis,
  WalletPosition,
} from "../types";

export interface AnalyzeWalletOptions {
  walletAddress: string;
  chains: Chain[];
  adapters: Partial<Record<Chain, ChainAdapter>>;
  navOverrides?: Partial<Record<string, number>>;
}

export async function analyzeWallet(
  options: AnalyzeWalletOptions,
): Promise<WalletAnalysis> {
  const positions = await collectPositions(options);
  const totalValueUsd = positions.reduce((sum, p) => sum + p.valueUsd, 0);

  return {
    walletAddress: options.walletAddress,
    chains: options.chains,
    totalValueUsd,
    positions,
    riskScore: scoreRisk(positions, totalValueUsd),
    concentrationByProtocol: groupConcentration(positions, totalValueUsd, (p) => p.protocolSlug),
    concentrationByChain: groupConcentration(positions, totalValueUsd, (p) => p.chain) as Record<Chain, number>,
    weightedApyBps: weightedApy(positions, totalValueUsd),
    analyzedAt: Date.now(),
  };
}

async function collectPositions(options: AnalyzeWalletOptions): Promise<WalletPosition[]> {
  const positions: WalletPosition[] = [];

  for (const chain of options.chains) {
    const adapter = options.adapters[chain];
    if (!adapter) continue;

    const protocols = getProtocolsByChain(chain);
    const contracts = protocols.map((p) => p.contractAddress);
    const balances = await adapter.fetchTokenBalances(options.walletAddress, contracts);

    for (const balance of balances) {
      if (balance.rawBalance === 0n) continue;
      const protocol = protocols.find(
        (p) => p.contractAddress.toLowerCase() === balance.contractAddress.toLowerCase(),
      );
      if (!protocol) continue;

      const tokens = Number(balance.rawBalance) / 10 ** balance.decimals;
      const nav = options.navOverrides?.[protocol.slug] ?? (await adapter.fetchNav(protocol));

      positions.push({
        protocolSlug: protocol.slug,
        protocolName: protocol.name,
        chain: protocol.chain,
        balance: tokens,
        valueUsd: tokens * nav,
        yieldApyBps: protocol.estimatedApyBps,
      });
    }
  }

  return positions;
}

function groupConcentration<T extends string>(
  positions: WalletPosition[],
  total: number,
  key: (p: WalletPosition) => T,
): Record<T, number> {
  const out = {} as Record<T, number>;
  if (total === 0) return out;
  for (const p of positions) {
    const k = key(p);
    out[k] = (out[k] ?? 0) + p.valueUsd / total;
  }
  return out;
}

function weightedApy(positions: WalletPosition[], total: number): number {
  if (total === 0) return 0;
  return positions.reduce((sum, p) => sum + p.yieldApyBps * (p.valueUsd / total), 0);
}

function scoreRisk(positions: WalletPosition[], total: number): RiskScore {
  if (total === 0 || positions.length === 0) {
    return {
      overall: 0,
      counterpartyRisk: "low",
      concentrationRisk: "low",
      smartContractRisk: "low",
      liquidityRisk: "low",
    };
  }

  const concentration = Math.max(...positions.map((p) => p.valueUsd / total));
  const concentrationRisk: RiskScore["concentrationRisk"] =
    concentration > 0.7 ? "high" : concentration > 0.4 ? "medium" : "low";

  return {
    overall: Math.round(concentration * 10),
    counterpartyRisk: "medium",
    concentrationRisk,
    smartContractRisk: "medium",
    liquidityRisk: "medium",
  };
}
