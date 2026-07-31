import { describe, it, expect } from "vitest";

import { positionTitle, unitLabelOf } from "./display";

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

/**
 * A row that can't say which holding it is isn't a row. Two sources — Jupiter Lend
 * USDC and OnRe ONyc — both titled "USDC", so a position funded days earlier looked
 * to its owner like it had never arrived.
 */
describe("positionTitle", () => {
  it("uses the ticker when the name carries one", () => {
    expect(positionTitle({ name: "Apple (AAPLx)", assetSymbol: "USDC" })).toBe("AAPLx");
  });

  it("falls back to the source's own name, never to what it was bought with", () => {
    expect(positionTitle({ name: "OnRe ONyc", assetSymbol: "USDC" })).toBe("OnRe ONyc");
    expect(positionTitle({ name: "Jupiter Lend USDC", assetSymbol: "USDC" })).toBe(
      "Jupiter Lend USDC",
    );
  });

  // The regression this caught: every Jupiter Lend market is NAMED "Jupiter Lend" —
  // the market lives only in the symbol. Falling back to the name alone turned two
  // positions in two different markets into one word, printed twice.
  it("names the market when several sources share one name", () => {
    expect(
      positionTitle({ name: "Jupiter Lend", assetSymbol: "USDC", group: "jupiter-lend" }),
    ).toBe("Jupiter Lend USDC");
    expect(
      positionTitle({ name: "Jupiter Lend", assetSymbol: "USDT", group: "jupiter-lend" }),
    ).toBe("Jupiter Lend USDT");
  });

  it("leaves a standalone source alone — there is nothing to disambiguate", () => {
    expect(positionTitle({ name: "OnRe ONyc", assetSymbol: "USDC" })).toBe("OnRe ONyc");
  });

  it("tells two sources apart even when both are paid for in the same currency", () => {
    const paidInUsdc = [
      { name: "OnRe ONyc", assetSymbol: "USDC" },
      { name: "Maple syrupUSDC", assetSymbol: "USDC" },
      { name: "Jupiter Lend USDC", assetSymbol: "USDC" },
    ];
    expect(new Set(paidInUsdc.map(positionTitle)).size).toBe(3);
  });
});
