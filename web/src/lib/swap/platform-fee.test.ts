import { describe, expect, it } from "vitest";

import { PLATFORM_FEE_BPS, platformFeeUsd } from "@oxar/sdk";

/**
 * The only function in the app that can decide money is ours. It gets its own test
 * file because every guard around it — the flag, the account, the disclosure row —
 * is worthless if the arithmetic underneath quietly charges the wrong number.
 */
describe("platformFeeUsd", () => {
  it("takes a quarter of a percent by default", () => {
    expect(PLATFORM_FEE_BPS).toBe(25);
    expect(platformFeeUsd(100)).toBeCloseTo(0.25, 10);
    expect(platformFeeUsd(1_000)).toBeCloseTo(2.5, 10);
  });

  it("charges nothing at a zero rate — the off switch", () => {
    expect(platformFeeUsd(100, 0)).toBe(0);
    expect(platformFeeUsd(1_000_000, 0)).toBe(0);
  });

  it("charges nothing on nothing, and refuses to invent a fee from a negative", () => {
    expect(platformFeeUsd(0)).toBe(0);
    expect(platformFeeUsd(-100)).toBe(0);
  });

  it("scales linearly, so half the trade is half the fee", () => {
    expect(platformFeeUsd(50) * 2).toBeCloseTo(platformFeeUsd(100), 10);
  });

  it("stays well under what a wallet charges for the same swap", () => {
    // Phantom ~0.85%, MetaMask ~0.875%. Being the cheap one is the whole position;
    // if this ever fails, the number was changed without that decision being made.
    expect(platformFeeUsd(100)).toBeLessThan(0.85);
  });
});
