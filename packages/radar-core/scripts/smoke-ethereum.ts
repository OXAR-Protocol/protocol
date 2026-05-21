/**
 * Smoke test for Phase 1 Day 3-5 — verifies EthereumAdapter end-to-end.
 *
 * Run with:
 *   ALCHEMY_API_KEY=<key> npx tsx scripts/smoke-ethereum.ts [walletAddress]
 *
 * Default wallet is a known BlackRock BUIDL holder so the test
 * actually finds something.
 */

import { analyzeWallet } from "../src/analyze/wallet";
import { EthereumAdapter } from "../src/chains/ethereum";

const DEFAULT_WALLET = "0x47A4c1F8B6D78c0B5d9C7B68fE61aC2EE36c5e26";

async function main(): Promise<void> {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    console.error("ALCHEMY_API_KEY env var is required");
    process.exit(1);
  }

  const wallet = process.argv[2] ?? DEFAULT_WALLET;
  console.error(`Analyzing ${wallet} on Ethereum...`);

  const ethereum = new EthereumAdapter({ alchemyApiKey: apiKey });
  const result = await analyzeWallet({
    walletAddress: wallet,
    chains: ["ethereum"],
    adapters: { ethereum },
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
