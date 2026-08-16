import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  swapPriceImpact,
  priceImpactTooHigh,
  BROKEN_MARKET_IMPACT,
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

  // Held-asset trades (stocks/gold/swap-and-hold) now show the cost and let the user
  // decide; only a broken market is refused. A 2% sell on a thin ticker MUST pass —
  // blocking it left holders with no way out, at any size.
  it("BROKEN_MARKET_IMPACT lets a real-but-expensive trade through", () => {
    for (const pct of ["0.0140", "0.0153", "0.0237", "0.0533"]) {
      expect(priceImpactTooHigh(quote({ priceImpactPct: pct }), BROKEN_MARKET_IMPACT)).toBe(false);
    }
  });

  it("BROKEN_MARKET_IMPACT still refuses a route that can't be real", () => {
    expect(priceImpactTooHigh(quote({ priceImpactPct: "0.76" }), BROKEN_MARKET_IMPACT)).toBe(true);
    expect(priceImpactTooHigh(quote({ priceImpactPct: "0.11" }), BROKEN_MARKET_IMPACT)).toBe(true);
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

  // Charging is off by default and has to stay that way: a caller that says nothing
  // about a fee must produce a request that says nothing about a fee.
  it("asks for no fee unless one is passed", async () => {
    await getSwapQuote({ inputMint: "SOL", outputMint: "USDC", amount: BigInt(1000) });
    expect(calls[0].url).not.toContain("platformFeeBps");
    calls = [];
    await getSwapQuote({ inputMint: "SOL", outputMint: "USDC", amount: BigInt(1000), platformFeeBps: 0 });
    expect(calls[0].url).not.toContain("platformFeeBps");
    calls = [];
    await buildSwapTx({} as SwapQuote, "OWNER");
    expect(JSON.parse(calls[0].body!).feeAccount).toBeUndefined();
  });

  it("carries the rate on the quote and the account on the build", async () => {
    await getSwapQuote({ inputMint: "SOL", outputMint: "USDC", amount: BigInt(1000), platformFeeBps: 25 });
    expect(calls[0].url).toContain("platformFeeBps=25");
    calls = [];
    await buildSwapTx({} as SwapQuote, "OWNER", { feeAccount: "FEEACC" });
    expect(JSON.parse(calls[0].body!)).toMatchObject({ feeAccount: "FEEACC" });
  });
});
