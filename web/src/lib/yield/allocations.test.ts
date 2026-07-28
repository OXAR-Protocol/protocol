import { describe, it, expect } from "vitest";

import { rescaleAllocations } from "@oxar/sdk";

describe("rescaleAllocations", () => {
  it("leaves the amounts alone when everything asked for arrived", () => {
    expect(rescaleAllocations({ a: 30, b: 20 }, 50)).toEqual({ a: 30, b: 20 });
  });

  it("leaves them alone when MORE arrived — the extra stays in the wallet", () => {
    expect(rescaleAllocations({ a: 30, b: 20 }, 60)).toEqual({ a: 30, b: 20 });
  });

  // The whole point: the conversion delivers a little less than quoted, and the
  // shortfall used to land entirely on the last purchase, which then failed.
  it("keeps the shares and shrinks the total when less arrived", () => {
    const out = rescaleAllocations({ a: 75, b: 25 }, 99);
    expect(out).toEqual({ a: 74.25, b: 24.75 });
  });

  it("never spends more than arrived", () => {
    const out = rescaleAllocations({ a: 33.33, b: 33.33, c: 33.34 }, 99.97);
    const total = Object.values(out).reduce((s, v) => s + v, 0);
    expect(total).toBeLessThanOrEqual(99.97);
  });

  it("drops rows and zero amounts that can't buy a cent", () => {
    // `b` still takes its share of the division before being floored away, so `a`
    // lands a cent under half — under, never over, which is the rule.
    expect(rescaleAllocations({ a: 100, b: 0.004 }, 50)).toEqual({ a: 49.99 });
    expect(rescaleAllocations({ a: 10, b: 0 }, 5)).toEqual({ a: 5 });
  });

  it("buys nothing when nothing arrived", () => {
    expect(rescaleAllocations({ a: 10 }, 0)).toEqual({});
    expect(rescaleAllocations({ a: 10 }, -1)).toEqual({});
    expect(rescaleAllocations({}, 100)).toEqual({});
  });
});
