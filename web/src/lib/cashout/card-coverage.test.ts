import { describe, it, expect } from "vitest";

import { cardRouteUnserved } from "@oxar/sdk";

describe("cardRouteUnserved", () => {
  it("flags the built-in card in Ukraine — MoonPay's own API says isBuyAllowed: false", () => {
    expect(cardRouteUnserved("builtin", "UA")).toBe(true);
    expect(cardRouteUnserved("builtin", "ua")).toBe(true);
  });

  it("leaves Paybis alone there — they restrict only occupied territories", () => {
    expect(cardRouteUnserved("paybis", "UA")).toBe(false);
  });

  it("says nothing when the country is unknown", () => {
    // Local dev has no Vercel geo header; silence beats a guessed warning.
    for (const unknown of [null, undefined, ""]) {
      expect(cardRouteUnserved("builtin", unknown)).toBe(false);
    }
  });

  it("says nothing for a country with no known restriction", () => {
    expect(cardRouteUnserved("builtin", "PL")).toBe(false);
    expect(cardRouteUnserved("paybis", "DE")).toBe(false);
  });

  it("treats an unknown route as unrestricted rather than throwing", () => {
    expect(cardRouteUnserved("whitebit", "UA")).toBe(false);
  });
});
