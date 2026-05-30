import { describe, it, expect } from "vitest";

import { toApyFraction, buildApyMap } from "./yields-api";

describe("toApyFraction", () => {
  it("converts a percent APY to a fraction", () => {
    expect(toApyFraction(5.635)).toBeCloseTo(0.05635, 9);
    expect(toApyFraction(0)).toBe(0);
  });
  it("returns 0 for null / negative / non-finite", () => {
    expect(toApyFraction(null)).toBe(0);
    expect(toApyFraction(-1)).toBe(0);
    expect(toApyFraction(Number.NaN)).toBe(0);
  });
});

describe("buildApyMap", () => {
  const pools = [
    { chain: "Solana", project: "kamino-lend", pool: "k-usdc", apy: 5.63 },
    { chain: "Solana", project: "jupiter-lend", pool: "j-usdc", apy: 5.29 },
    { chain: "Ethereum", project: "aave", pool: "x", apy: 9 }, // wrong chain
    { chain: "Solana", project: "raydium", pool: "y", apy: 12 }, // wrong project
    { chain: "Solana", project: "kamino-lend", pool: "k-bad", apy: null }, // no apy
  ];

  it("keeps only Kamino/Jupiter Solana pools with a numeric apy, keyed by pool id (percent)", () => {
    expect(buildApyMap(pools)).toEqual({ "k-usdc": 5.63, "j-usdc": 5.29 });
  });

  it("tolerates an empty / malformed list", () => {
    expect(buildApyMap([])).toEqual({});
  });
});
