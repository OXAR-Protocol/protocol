import { describe, it, expect } from "vitest";

import { usdyToSwapForWithdraw } from "./ondo";

// USDY ≈ $1.1337. A position of 88.07 USDY ≈ 99.85 USDC. Both mints are 6-decimal.
const USDY = BigInt(88_070_000); // 88.07 USDY base units
const VALUE = BigInt(99_850_000); // ~99.85 USDC base units

describe("usdyToSwapForWithdraw", () => {
  it("swaps the whole balance when the request meets or exceeds the position value", () => {
    expect(usdyToSwapForWithdraw(USDY, VALUE, VALUE)).toBe(USDY);
    expect(usdyToSwapForWithdraw(USDY, VALUE, VALUE + BigInt(1))).toBe(USDY);
    expect(usdyToSwapForWithdraw(USDY, VALUE, BigInt(1_000_000_000))).toBe(USDY);
  });

  it("swaps a proportional slice for a partial withdraw", () => {
    // Ask for ~half the value → ~half the USDY.
    const half = VALUE / BigInt(2);
    const got = usdyToSwapForWithdraw(USDY, VALUE, half);
    expect(got).toBe((USDY * half) / VALUE);
    expect(got).toBeLessThan(USDY);
    expect(got).toBeGreaterThan(BigInt(0));
  });

  it("never returns more than the held balance", () => {
    const got = usdyToSwapForWithdraw(USDY, VALUE, VALUE - BigInt(1));
    expect(got).toBeLessThanOrEqual(USDY);
  });

  it("returns 0 for an empty position", () => {
    expect(usdyToSwapForWithdraw(BigInt(0), BigInt(0), BigInt(50_000_000))).toBe(BigInt(0));
  });

  it("treats a non-positive position value as a full exit (avoids div-by-zero)", () => {
    expect(usdyToSwapForWithdraw(USDY, BigInt(0), BigInt(10_000_000))).toBe(USDY);
  });
});
