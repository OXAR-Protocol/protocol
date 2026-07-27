import { describe, it, expect } from "vitest";

import { buildApyMap, buildTvlMap, type DefiLlamaPool } from "./yields-api";
import { PROVIDERS } from "./registry";

/**
 * Guards the coupling that silently broke ONyc: a source can declare a valid
 * DefiLlama pool id and still read **0% APY**, because `buildApyMap` drops any pool
 * whose PROJECT isn't allowlisted. Nothing in the provider tells you that — and the
 * sparkline keeps working (history is fetched per-pool, unfiltered), so the card
 * looks alive while the headline number is zero.
 *
 * The fixture is what DefiLlama actually serves for each pool (verified live). A new
 * source with no row here fails the first assertion; a source whose project isn't
 * allowlisted fails the second.
 */
const POOL_ROWS: Record<string, { chain: string; project: string }> = {
  "d783c8df-e2ed-44b4-8317-161ccc1b5f06": { chain: "Solana", project: "jupiter-lend" },
  "a2fbc7ec-22c2-43fe-aa42-49f854aa940d": { chain: "Solana", project: "jupiter-lend" },
  "00b83068-9f87-4411-b5d7-5d2ff48c40c4": { chain: "Solana", project: "ondo-yield-assets" },
  // Maple's protocol-wide Syrup rate lives on its ETHEREUM pool — allowlisted by id.
  "43641cf5-a92e-416b-bce9-27113d3c0db6": { chain: "Ethereum", project: "maple" },
  "7083d6a5-e3cb-4eeb-8204-f1b735e4ecbb": { chain: "Solana", project: "onre" },
};

const withPool = PROVIDERS.filter((p) => p.defiLlamaPoolId);

describe("every source's APY survives the DefiLlama filter", () => {
  it("has a fixture row for each registered pool id", () => {
    for (const p of withPool) {
      expect(
        POOL_ROWS[p.defiLlamaPoolId as string],
        `${p.id}: add its real DefiLlama chain/project to POOL_ROWS`,
      ).toBeDefined();
    }
  });

  it("resolves an APY and a TVL for each — not a silent 0%", () => {
    const pools: DefiLlamaPool[] = withPool.map((p) => ({
      ...POOL_ROWS[p.defiLlamaPoolId as string]!,
      pool: p.defiLlamaPoolId as string,
      apy: 7.5,
      tvlUsd: 1_000_000,
    }));
    const apy = buildApyMap(pools);
    const tvl = buildTvlMap(pools);
    for (const p of withPool) {
      const id = p.defiLlamaPoolId as string;
      expect(apy[id], `${p.id}: filtered out of the APY map → the card reads 0%`).toBe(7.5);
      expect(tvl[id], `${p.id}: filtered out of the TVL map`).toBe(1_000_000);
    }
  });
});
