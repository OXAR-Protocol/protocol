import { describe, it, expect } from "vitest";

import { swapNetOut, swapPriceImpact, priceImpactTooHigh, type SwapQuote } from "./jupiter-swap";

const quote = (over: Partial<SwapQuote>): SwapQuote => ({
  inputMint: "SOL",
  outputMint: "USDC",
  inAmount: "100000000",
  outAmount: "8300455",
  otherAmountThreshold: "8259000",
  priceImpactPct: "0",
  slippageBps: 50,
  swapMode: "ExactIn",
  ...over,
});

describe("jupiter-swap helpers", () => {
  it("swapNetOut converts outAmount to UI units", () => {
    expect(swapNetOut(quote({ outAmount: "8300455" }), 6)).toBeCloseTo(8.300455, 6);
  });

  it("swapPriceImpact parses the fraction, 0 on garbage", () => {
    expect(swapPriceImpact(quote({ priceImpactPct: "0.0123" }))).toBeCloseTo(0.0123, 6);
    expect(swapPriceImpact(quote({ priceImpactPct: "abc" }))).toBe(0);
  });

  it("priceImpactTooHigh trips above the cap", () => {
    expect(priceImpactTooHigh(quote({ priceImpactPct: "0.02" }))).toBe(true);
    expect(priceImpactTooHigh(quote({ priceImpactPct: "0.005" }))).toBe(false);
    expect(priceImpactTooHigh(quote({ priceImpactPct: "0.05" }), 0.1)).toBe(false);
  });
});
