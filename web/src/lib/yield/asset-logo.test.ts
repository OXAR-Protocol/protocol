import { describe, it, expect } from "vitest";

import { assetLogoSrc } from "./asset-logo";
import { PROVIDERS } from "./registry";

/**
 * A logo is keyed by provider id, and nothing at the type level says the key is a
 * real one — a first pass shipped "maple-syrup" against a provider called
 * "maple-solana", so Maple silently fell back to a "US" monogram while every source
 * beside it had a picture. A wrong key can only be caught by asking the registry.
 */
describe("assetLogoSrc", () => {
  const ids = PROVIDERS.map((p) => p.id);

  it("gives every non-stock source a logo", () => {
    const missing = PROVIDERS.filter((p) => !p.id.startsWith("xstock-")).filter(
      (p) => !assetLogoSrc(p.id),
    );
    expect(missing.map((p) => p.id)).toEqual([]);
  });

  it("serves stock logos by ticker", () => {
    expect(assetLogoSrc("xstock-aapl")).toBe("/logos/xstocks/AAPL.png");
  });

  it("has no logo for an id that isn't a source", () => {
    expect(assetLogoSrc("not-a-provider")).toBeUndefined();
    // Guards the typo class above: every keyed id must exist in the registry.
    for (const id of ["jupiter-lend-usdc", "maple-solana", "gold-oro", "gold-xaut"]) {
      expect(ids).toContain(id);
    }
  });
});
