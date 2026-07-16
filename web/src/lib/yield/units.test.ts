import { describe, it, expect } from "vitest";

import { toBaseUnits, fromBaseUnits } from "@oxar/sdk";

describe("toBaseUnits", () => {
  it("converts whole amounts (USDC, 6dp)", () => {
    expect(toBaseUnits("1", 6)).toBe(1_000_000n);
    expect(toBaseUnits("50", 6)).toBe(50_000_000n);
    expect(toBaseUnits("0", 6)).toBe(0n);
  });

  it("converts fractional amounts exactly", () => {
    expect(toBaseUnits("0.5", 6)).toBe(500_000n);
    expect(toBaseUnits("0.000001", 6)).toBe(1n);
    expect(toBaseUnits("123.456789", 6)).toBe(123_456_789n);
  });

  it("accepts a number as well as a string", () => {
    expect(toBaseUnits(1, 6)).toBe(1_000_000n);
    expect(toBaseUnits(0.5, 6)).toBe(500_000n);
  });

  // The whole reason for bigint-first: float `amount * 10**decimals` loses
  // precision at high decimals (10**18 isn't exactly representable as a double).
  it("is exact for 18-decimal assets (where float breaks)", () => {
    expect(toBaseUnits("1", 18)).toBe(1_000_000_000_000_000_000n);
    expect(toBaseUnits("0.123456789012345678", 18)).toBe(123_456_789_012_345_678n);
    expect(toBaseUnits("2.5", 18)).toBe(2_500_000_000_000_000_000n);
  });

  it("truncates precision finer than the asset supports (no over-credit)", () => {
    expect(toBaseUnits("1.2345678", 6)).toBe(1_234_567n); // 8th dp dropped
    expect(toBaseUnits("0.0000009", 6)).toBe(0n);
  });

  it("rejects invalid or negative input", () => {
    expect(() => toBaseUnits("-1", 6)).toThrow();
    expect(() => toBaseUnits("abc", 6)).toThrow();
    expect(() => toBaseUnits("", 6)).toThrow();
  });
});

describe("fromBaseUnits", () => {
  it("converts base units to a human number for display", () => {
    expect(fromBaseUnits(1_000_000n, 6)).toBe(1);
    expect(fromBaseUnits(500_000n, 6)).toBe(0.5);
    expect(fromBaseUnits(0n, 6)).toBe(0);
  });

  it("round-trips with toBaseUnits for typical USDC amounts", () => {
    for (const v of ["1", "50", "0.5", "123.45"]) {
      expect(fromBaseUnits(toBaseUnits(v, 6), 6)).toBe(Number(v));
    }
  });
});
