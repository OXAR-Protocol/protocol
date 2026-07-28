import { describe, it, expect } from "vitest";

import { unitLabelOf } from "./display";

describe("unitLabelOf", () => {
  // The bug: a tokenised stock settles in USDC, so `assetSymbol` is "USDC" — using
  // it to label a share count read "0.005868 USDC" for something that is neither
  // USDC nor that amount of it.
  it("takes the ticker from the name, not the settlement currency", () => {
    expect(unitLabelOf({ name: "Apple (AAPLx)", assetSymbol: "USDC" })).toBe("AAPLx");
    expect(unitLabelOf({ name: "Broadcom (AVGOx)", assetSymbol: "USDC" })).toBe("AVGOx");
  });

  it("falls back to the symbol when the name carries no ticker", () => {
    expect(unitLabelOf({ name: "Jupiter Lend USDC", assetSymbol: "USDC" })).toBe("USDC");
  });

  it("reads the FIRST parenthesised group", () => {
    expect(unitLabelOf({ name: "Tether Gold (XAUt0)", assetSymbol: "USDC" })).toBe("XAUt0");
    // Worth knowing rather than assuming: a name with an earlier aside would give
    // that aside, not the ticker. No such name exists today.
    expect(unitLabelOf({ name: "Thing (note) (TICKx)", assetSymbol: "USDC" })).toBe("note");
  });
});
