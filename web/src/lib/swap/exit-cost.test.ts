import { describe, it, expect } from "vitest";

import { exitCostFraction, exitCostBand, findExitCeiling } from "@oxar/sdk";

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

// Reproduces the WMTx finding: $200 quotes, $225 doesn't, and pool depth doesn't
// recover on its own — a user who bought $1000 needs to know the real ceiling,
// not just that "it's thin right now".
describe("findExitCeiling", () => {
  /** A probe that succeeds only at or below `maxSellableUsd` — models a pool
   * with a hard depth limit, like the real WMTx measurement. */
  function poolWithCeiling(maxSellableUsd: number) {
    const calls: number[] = [];
    const probe = async (usd: number) => {
      calls.push(usd);
      return usd <= maxSellableUsd;
    };
    return { probe, calls };
  }

  it("finds a ceiling below the requested amount", async () => {
    const { probe, calls } = poolWithCeiling(200); // matches the WMTx measurement
    const result = await findExitCeiling({ upperBoundUsd: 1000, probe });
    expect(result.ceilingUsd).not.toBeNull();
    expect(result.ceilingUsd!).toBeGreaterThan(0);
    expect(result.ceilingUsd!).toBeLessThanOrEqual(200);
    expect(result.ceilingUsd!).toBeGreaterThan(150); // within resolution of the real ceiling
    expect(calls.length).toBeGreaterThan(0);
  });

  it("reports a ceiling close to the bound when nothing below it ever fails", async () => {
    // The pool can absorb far more than what's being searched for — the search
    // never gets to test the bound itself, so it converges just under it.
    const { probe } = poolWithCeiling(1_000_000);
    const result = await findExitCeiling({ upperBoundUsd: 250, probe });
    expect(result.ceilingUsd).not.toBeNull();
    expect(result.ceilingUsd!).toBeGreaterThanOrEqual(250 - 25 * 2);
    expect(result.ceilingUsd!).toBeLessThan(250);
  });

  it("returns null when even the smallest probed size fails", async () => {
    const probe = async () => false; // nothing sells at any size
    const result = await findExitCeiling({ upperBoundUsd: 500, probe });
    expect(result.ceilingUsd).toBeNull();
  });

  it("never exceeds the probe budget, however wide the search range", async () => {
    const { probe, calls } = poolWithCeiling(37); // an awkward, non-round ceiling
    const result = await findExitCeiling({ upperBoundUsd: 100_000, probe, maxProbes: 6 });
    expect(calls.length).toBeLessThanOrEqual(6);
    expect(result.probesUsed).toBeLessThanOrEqual(6);
    expect(result.probesUsed).toBe(calls.length);
  });

  it("degrades to null cleanly for a degenerate bound", async () => {
    const probe = async () => true;
    expect((await findExitCeiling({ upperBoundUsd: 0, probe })).ceilingUsd).toBeNull();
    expect((await findExitCeiling({ upperBoundUsd: -50, probe })).ceilingUsd).toBeNull();
  });
});
