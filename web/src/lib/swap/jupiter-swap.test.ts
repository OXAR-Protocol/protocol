import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  swapPriceImpact,
  priceImpactTooHigh,
  getSwapQuote,
  buildSwapTx,
  type SwapQuote,
} from "@oxar/sdk";

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

describe("legacy-transaction flag (external wallets need legacy, not v0)", () => {
  let calls: Array<{ url: string; body?: string }> = [];
  beforeEach(() => {
    calls = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: { body?: string }) => {
        calls.push({ url: String(url), body: init?.body });
        return { ok: true, json: async () => ({ outAmount: "1", swapTransaction: "AA==" }) } as Response;
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("getSwapQuote requests a legacy route only when asLegacy", async () => {
    await getSwapQuote({ inputMint: "SOL", outputMint: "USDC", amount: BigInt(1000), asLegacy: true });
    expect(calls[0].url).toContain("asLegacyTransaction=true");
    calls = [];
    await getSwapQuote({ inputMint: "SOL", outputMint: "USDC", amount: BigInt(1000) });
    expect(calls[0].url).not.toContain("asLegacyTransaction");
  });

  it("buildSwapTx asks Jupiter for a legacy tx only when asLegacy", async () => {
    await buildSwapTx({} as SwapQuote, "OWNER", { asLegacy: true });
    expect(JSON.parse(calls[0].body!)).toMatchObject({ asLegacyTransaction: true });
    calls = [];
    await buildSwapTx({} as SwapQuote, "OWNER");
    expect(JSON.parse(calls[0].body!).asLegacyTransaction).toBeUndefined();
  });
});
