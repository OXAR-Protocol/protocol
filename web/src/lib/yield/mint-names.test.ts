import { describe, it, expect } from "vitest";

import { isCashMint, nameOfMint } from "./mint-names";
import { CASH_MINTS, JL_USDC, JL_USDT } from "./position-mints";
import { PROVIDERS } from "./registry";

const held = PROVIDERS.filter((p) => p.heldMint);

/**
 * The breakdown under the chart exists to answer one question — WHICH holding earned
 * or lost this — so a name that can't tell two holdings apart defeats the whole
 * feature. It shipped doing exactly that: named by `assetSymbol`, which on every
 * swap-and-hold source is the currency you PAY WITH, every stock and every gram of
 * gold collapsed into a single row called "usdc".
 */
describe("naming a holding", () => {
  it("gives every held mint its own name", () => {
    const names = held.map((p) => nameOfMint(p.heldMint as string));
    expect(names.every((n) => n !== null)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  it("never names a holding after the currency it was bought with", () => {
    // The exact regression: "USDC" is the assetSymbol of every swap-and-hold source.
    const symbols = new Set(held.map((p) => p.assetSymbol));
    expect(symbols).toEqual(new Set(["USDC"])); // …which is why it can't be the name
    for (const p of held) expect(nameOfMint(p.heldMint as string)).not.toBe(p.assetSymbol);
  });

  it("names the Jupiter Lend receipts, which no provider declares", () => {
    expect(nameOfMint(JL_USDC)).toBe("Jupiter Lend USDC");
    expect(nameOfMint(JL_USDT)).toBe("Jupiter Lend USDT");
  });

  it("treats every dollar as cash and nothing else as cash", () => {
    for (const mint of CASH_MINTS) expect(isCashMint(mint)).toBe(true);
    for (const p of held) expect(isCashMint(p.heldMint as string)).toBe(false);
  });

  it("says nothing rather than guessing at a mint it doesn't know", () => {
    expect(nameOfMint("SomeMintWeHaveNeverSeenBefore1111111111111")).toBeNull();
  });
});
