import {
  analyzeWallet,
  EthereumAdapter,
  explainWallet,
  SolanaAdapter,
  type Chain,
  type ChainAdapter,
  type ExplainOutput,
  type WalletAnalysis,
} from "@oxar/radar-core";

import { getServerEnv } from "./env";

export interface AnalyzeResult {
  analysis: WalletAnalysis;
  explanation: ExplainOutput;
}

export async function runAnalyze(input: {
  walletAddress: string;
  chains: Chain[];
  language: ExplainOutput["language"];
}): Promise<AnalyzeResult> {
  const env = getServerEnv();

  const adapters: Partial<Record<Chain, ChainAdapter>> = {};
  if (input.chains.includes("ethereum")) {
    adapters.ethereum = new EthereumAdapter({ alchemyApiKey: env.alchemyApiKey });
  }
  if (input.chains.includes("solana") && env.heliusApiKey) {
    adapters.solana = new SolanaAdapter({ heliusApiKey: env.heliusApiKey });
  }

  const analysis = await analyzeWallet({
    walletAddress: input.walletAddress,
    chains: input.chains,
    adapters,
  });

  const explanation = await explainWallet(analysis, {
    anthropicApiKey: env.anthropicApiKey,
    language: input.language,
  });

  return { analysis, explanation };
}
