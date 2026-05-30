import { describe, it, expect } from "vitest";

import { parseJupiterApy, createJupiterLendProvider } from "./jupiter";

describe("parseJupiterApy", () => {
  it("converts a basis-point totalRate string to a fraction", () => {
    expect(parseJupiterApy("530")).toBeCloseTo(0.053, 9);
    expect(parseJupiterApy("799")).toBeCloseTo(0.0799, 9);
    expect(parseJupiterApy("0")).toBe(0);
  });

  it("returns 0 for missing or non-numeric input", () => {
    expect(parseJupiterApy(undefined)).toBe(0);
    expect(parseJupiterApy("abc")).toBe(0);
  });
});

describe("createJupiterLendProvider", () => {
  it("maps config onto a YieldProvider with the right asset/decimals/symbol", () => {
    const p = createJupiterLendProvider({
      id: "jupiter-lend-usdt",
      assetSymbol: "USDT",
      assetMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
      decimals: 6,
      description: "USDT lending on Solana · withdraw anytime",
      riskLevel: "low",
    });

    expect(p.id).toBe("jupiter-lend-usdt");
    expect(p.name).toBe("Jupiter Lend");
    expect(p.assetSymbol).toBe("USDT");
    expect(p.decimals).toBe(6);
    expect(p.chain).toBe("solana");
    expect(p.asset.toBase58()).toBe("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
  });
});
