import { describe, it, expect } from "vitest";

import { isStockBlockedCountry } from "./geoblock";

describe("isStockBlockedCountry", () => {
  it("blocks US and restricted jurisdictions", () => {
    expect(isStockBlockedCountry("US")).toBe(true);
    expect(isStockBlockedCountry("us")).toBe(true); // case-insensitive
    expect(isStockBlockedCountry("CA")).toBe(true);
    expect(isStockBlockedCountry("RU")).toBe(true);
  });

  it("blocks the countries the issuer will not serve", () => {
    expect(isStockBlockedCountry("NG")).toBe(true); // Nigeria
    expect(isStockBlockedCountry("PH")).toBe(true); // Philippines
    expect(isStockBlockedCountry("AU")).toBe(true); // named unavailable by xStocks
  });

  it("cannot see regions — occupied Ukrainian territories report UA and pass", () => {
    // The issuers exclude Crimea, Sevastopol, Luhansk and Donetsk, but the
    // country header returns UA for all of them. Disclosed in the terms (§7)
    // instead; closing it needs a region header, not another country code.
    expect(isStockBlockedCountry("UA")).toBe(false);
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
