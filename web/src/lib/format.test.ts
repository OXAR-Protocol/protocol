import { describe, it, expect } from "vitest";

import { formatUsdAmount, formatSignedUsd, floorToCents } from "@oxar/sdk";

describe("money a person can read", () => {
  // The reported figures: a balance rendered 19.999785 and a P&L rendered −$0.377655.
  it("brings full float precision down to cents", () => {
    expect(formatUsdAmount(19.999785)).toBe("20.00");
    expect(formatSignedUsd(-0.377655)).toBe("−$0.38");
  });

  it("groups thousands", () => {
    expect(formatUsdAmount(1234.5)).toBe("1,234.50");
  });

  // Rounding a real amount to $0.00 is its own lie.
  it("says a sub-cent amount is small rather than nothing", () => {
    expect(formatUsdAmount(0.004)).toBe("<0.01");
    expect(formatSignedUsd(0.0001)).toBe("+$<0.01");
    expect(formatUsdAmount(0)).toBe("0.00");
  });

  it("signs with a minus, not a hyphen", () => {
    expect(formatSignedUsd(-1.2)).toBe("−$1.20");
    expect(formatSignedUsd(1.2)).toBe("+$1.20");
  });

  it("survives a non-finite value instead of printing NaN", () => {
    expect(formatUsdAmount(Number.NaN)).toBe("0.00");
    expect(floorToCents(Number.POSITIVE_INFINITY)).toBe(0);
  });

  // Prefilling MAX must never offer more than the balance holds.
  it("floors to cents, never up", () => {
    expect(floorToCents(19.999785)).toBe(19.99);
    expect(floorToCents(0.004)).toBe(0);
  });
});
