import { describe, it, expect } from "vitest";

import { isStockBlockedCountry } from "./geoblock";

describe("isStockBlockedCountry", () => {
  it("blocks US and restricted jurisdictions", () => {
    expect(isStockBlockedCountry("US")).toBe(true);
    expect(isStockBlockedCountry("us")).toBe(true); // case-insensitive
    expect(isStockBlockedCountry("CA")).toBe(true);
    expect(isStockBlockedCountry("RU")).toBe(true);
  });

  it("allows non-restricted jurisdictions", () => {
    expect(isStockBlockedCountry("UA")).toBe(false);
    expect(isStockBlockedCountry("DE")).toBe(false);
    expect(isStockBlockedCountry("BR")).toBe(false);
  });

  it("allows when country is unknown (dev / missing header)", () => {
    expect(isStockBlockedCountry(null)).toBe(false);
    expect(isStockBlockedCountry(undefined)).toBe(false);
    expect(isStockBlockedCountry("")).toBe(false);
  });
});
