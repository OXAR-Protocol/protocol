import { describe, it, expect } from "vitest";

import { planTopUp, convertibleUsd, MIN_CONVERT_USD, type WalletAsset } from "@oxar/sdk";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function coin(mint: string, symbol: string, uiAmount: number, usdValue: number, decimals = 6): WalletAsset {
  return {
    mint,
    symbol,
    decimals,
    amount: BigInt(Math.round(uiAmount * 10 ** decimals)),
    uiAmount,
    usdValue,
    chain: "solana",
  };
}

describe("convertibleUsd", () => {
  it("counts everything that isn't already dollars", () => {
    const assets = [coin(USDC, "USDC", 10, 10), coin("mintA", "USDT", 25, 25)];
    expect(convertibleUsd(assets, USDC)).toBeCloseTo(25, 2);
  });

  it("ignores dust — a swap that small costs more than it delivers", () => {
    const assets = [coin("mintA", "BONK", 100, MIN_CONVERT_USD / 2)];
    expect(convertibleUsd(assets, USDC)).toBe(0);
  });
});

describe("planTopUp", () => {
  it("covers the gap from the biggest holding first, in ONE swap where it can", () => {
    const assets = [coin("mintA", "USDT", 40, 40), coin("mintB", "JUP", 20, 20)];
    const legs = planTopUp(assets, 30, USDC);
    expect(legs).toHaveLength(1);
    expect(legs[0]!.asset.symbol).toBe("USDT");
    // Asks for slightly more than the gap: a swap lands at or under its quote.
    expect(legs[0]!.usd).toBeGreaterThan(30);
    expect(legs[0]!.usd).toBeLessThanOrEqual(40);
  });

  it("reaches into the next coin when the first can't cover it", () => {
    const assets = [coin("mintA", "USDT", 10, 10), coin("mintB", "JUP", 30, 30)];
    const legs = planTopUp(assets, 35, USDC);
    expect(legs.map((l) => l.asset.symbol)).toEqual(["JUP", "USDT"]);
    expect(legs.reduce((sum, l) => sum + l.usd, 0)).toBeGreaterThanOrEqual(35);
  });

  it("never plans a conversion when there is no gap", () => {
    expect(planTopUp([coin("mintA", "USDT", 40, 40)], 0, USDC)).toEqual([]);
    expect(planTopUp([coin("mintA", "USDT", 40, 40)], -5, USDC)).toEqual([]);
  });

  it("leaves dollars alone — they are already what's being spent", () => {
    expect(planTopUp([coin(USDC, "USDC", 50, 50)], 20, USDC)).toEqual([]);
  });

  it("doesn't convert a whole holding to cover a few cents", () => {
    const legs = planTopUp([coin("mintA", "SOL", 1, 200, 9)], 0.02, USDC);
    expect(legs).toHaveLength(1);
    expect(legs[0]!.usd).toBeCloseTo(MIN_CONVERT_USD, 6);
  });
});
