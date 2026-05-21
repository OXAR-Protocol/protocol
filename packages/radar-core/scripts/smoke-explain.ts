/**
 * Smoke test for Phase 1 Day 6-8 — verifies Claude Haiku explain layer.
 *
 * Run with:
 *   ANTHROPIC_API_KEY=<key> npx tsx scripts/smoke-explain.ts [language]
 *
 * Uses a synthetic WalletAnalysis so we don't burn Alchemy calls during
 * prompt iteration. language defaults to "en", also accepts "ru" or "pl".
 */

import { explainWallet } from "../src/explain/wallet";
import type { ExplainOutput, WalletAnalysis } from "../src/types";

const FIXTURE: WalletAnalysis = {
  walletAddress: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
  chains: ["ethereum"],
  totalValueUsd: 153_400,
  weightedApyBps: 612,
  positions: [
    {
      protocolSlug: "ondo-usdy",
      protocolName: "Ondo USDY",
      chain: "ethereum",
      balance: 90_000,
      valueUsd: 99_000,
      yieldApyBps: 480,
    },
    {
      protocolSlug: "maple-finance",
      protocolName: "Maple Finance",
      chain: "ethereum",
      balance: 51_320,
      valueUsd: 54_400,
      yieldApyBps: 1_050,
    },
  ],
  riskScore: {
    overall: 6,
    counterpartyRisk: "medium",
    concentrationRisk: "medium",
    smartContractRisk: "medium",
    liquidityRisk: "medium",
  },
  concentrationByProtocol: {
    "ondo-usdy": 0.645,
    "maple-finance": 0.355,
  },
  concentrationByChain: { ethereum: 1.0, solana: 0 },
  analyzedAt: Date.now(),
};

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY env var is required");
    process.exit(1);
  }

  const language = (process.argv[2] ?? "en") as ExplainOutput["language"];
  console.error(`Explaining sample portfolio in ${language}...`);

  const result = await explainWallet(FIXTURE, {
    anthropicApiKey: apiKey,
    language,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
