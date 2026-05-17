/**
 * Smoke test for Phase 1 Day 12-14 — verifies SolanaAdapter end-to-end.
 *
 * Run with:
 *   HELIUS_API_KEY=<key> npx tsx scripts/smoke-solana.ts [walletAddress]
 *
 * Note: the registry currently lists no Solana mints (verified mainnet
 * mint addresses for Ondo USDY (Solana), Etherfuse stablebonds, and
 * the OXAR vault tokens land in Phase 2 / OXAR mainnet launch). This
 * smoke test still exercises the adapter wiring — it should print an
 * empty positions array without errors.
 */

import { analyzeWallet } from "../src/analyze/wallet";
import { SolanaAdapter } from "../src/chains/solana";

const DEFAULT_WALLET = "5tzFkiKscXHK5ZXCGbXbH4tg9YpJ5pTGSwBfvWNVQrAH";

async function main(): Promise<void> {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    console.error("HELIUS_API_KEY env var is required");
    process.exit(1);
  }

  const wallet = process.argv[2] ?? DEFAULT_WALLET;
  console.error(`Analyzing ${wallet} on Solana...`);

  const solana = new SolanaAdapter({ heliusApiKey: apiKey });
  const result = await analyzeWallet({
    walletAddress: wallet,
    chains: ["solana"],
    adapters: { solana },
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
