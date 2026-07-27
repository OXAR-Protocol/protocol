import { describe, it, expect } from "vitest";

import {
  formatUsdAmount,
  formatSignedUsd,
  floorToCents,
  centPrecision,
  floorTo,
  normalizeDecimalInput,
} from "@oxar/sdk";

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

describe("prefilling an amount without stranding value", () => {
  // Full token precision is what put `4,84121` in the deposit field.
  it("keeps two decimals for a dollar-priced token", () => {
    expect(centPrecision(1)).toBe(2);
    expect(floorTo(4.841219, centPrecision(1))).toBe(4.84);
  });

  // A flat two decimals would abandon ~$2 of SOL, which is not a rounding choice.
  it("keeps more decimals for an expensive token", () => {
    expect(centPrecision(180)).toBe(5);
    expect(floorTo(0.1299999, centPrecision(180))).toBe(0.12999);
  });

  it("never rounds up past the balance", () => {
    expect(floorTo(1.999999, 2)).toBe(1.99);
  });

  it("falls back to cents on a missing price", () => {
    expect(centPrecision(0)).toBe(2);
    expect(centPrecision(Number.NaN)).toBe(2);
  });
});

describe("amounts typed on a non-English keyboard", () => {
  // Browsers render <input type="number"> with the OS separator, so a Ukrainian
  // locale shows and produces "4,84121" — and Number("4,84") is NaN.
  it("accepts a comma as the decimal separator", () => {
    expect(normalizeDecimalInput("4,84121")).toBe("4.84121");
    expect(Number(normalizeDecimalInput("2,999548"))).toBeCloseTo(2.999548);
  });

  it("keeps one separator and drops stray characters", () => {
    expect(normalizeDecimalInput("1.2.3")).toBe("1.23");
    // "1 234,5" is how 1234.5 is written in Ukrainian — the comma is the separator.
    expect(normalizeDecimalInput("$1 234,5")).toBe("1234.5");
    expect(normalizeDecimalInput("abc")).toBe("");
  });
});
