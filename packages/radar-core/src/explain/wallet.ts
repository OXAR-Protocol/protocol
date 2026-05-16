import type { ExplainOutput, WalletAnalysis } from "../types";

export interface ExplainConfig {
  anthropicApiKey: string;
  model?: string;
  language?: ExplainOutput["language"];
}

export async function explainWallet(
  _analysis: WalletAnalysis,
  _config: ExplainConfig,
): Promise<ExplainOutput> {
  throw new Error("explainWallet: not implemented (Day 6-8 — Claude Haiku integration)");
}
