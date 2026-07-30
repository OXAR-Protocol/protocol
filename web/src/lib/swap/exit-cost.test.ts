import { describe, it, expect } from "vitest";

import { exitCostFraction, exitCostBand } from "@oxar/sdk";

describe("exitCostFraction", () => {
  it("reads the gap between what went in and what would come back", () => {
    expect(exitCostFraction(100, 97.9)).toBeCloseTo(0.021, 6);
  });

  // The whole point of the Visa rejection: a cheap one-way SELL quote can still
  // sit on top of an expensive round trip once the buy-side spread is counted.
  it("reproduces the Visa round trip that got it rejected", () => {
    expect(exitCostFraction(100, 95.3)).toBeCloseTo(0.047, 6);
  });

  it("clamps a favorable move to zero instead of a negative cost", () => {
    expect(exitCostFraction(100, 105)).toBe(0);
  });

  it("returns null for nothing spent, not zero cost", () => {
    expect(exitCostFraction(0, 50)).toBeNull();
    expect(exitCostFraction(-10, 50)).toBeNull();
  });

  it("returns null for a missing or broken quote", () => {
    expect(exitCostFraction(100, null)).toBeNull();
    expect(exitCostFraction(100, Number.NaN)).toBeNull();
  });

  it("returns null when the input itself is non-finite", () => {
    expect(exitCostFraction(Number.NaN, 50)).toBeNull();
    expect(exitCostFraction(Number.POSITIVE_INFINITY, 50)).toBeNull();
  });
});

describe("exitCostBand", () => {
  it("reports no band for a missing fraction, not the cheapest one", () => {
    expect(exitCostBand(null)).toBe("none");
  });

  it("calls the near-zero end of the shelf cheap (SPYx territory)", () => {
    expect(exitCostBand(0)).toBe("cheap");
    expect(exitCostBand(0.0001)).toBe("cheap");
    expect(exitCostBand(0.005)).toBe("cheap");
  });

  it("calls the middle of the shelf normal", () => {
    expect(exitCostBand(0.006)).toBe("normal");
    expect(exitCostBand(0.02)).toBe("normal");
  });

  // WMTx (~3.55%) is the worst thing we already ship; Visa's 4.70% is what got it
  // rejected. Both land in "expensive" — the band flags them, it doesn't hide them.
  it("calls the worst of the shelf, and worse than the shelf, expensive", () => {
    expect(exitCostBand(0.021)).toBe("expensive");
    expect(exitCostBand(0.0355)).toBe("expensive");
    expect(exitCostBand(0.047)).toBe("expensive");
  });
});
