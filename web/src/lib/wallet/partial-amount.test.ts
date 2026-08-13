import { describe, it, expect } from "vitest";

import { toBaseUnits, toBaseUnitsPartial } from "@oxar/sdk";

/**
 * The crash this exists to stop: an amount field holds "0." for the moment between
 * the zero and the cents, the strict parser throws on it, and the throw happens
 * during a render — which a phone browser reports as "this page couldn't load".
 */
describe("toBaseUnitsPartial", () => {
  it("reads a finished number exactly like the strict parser", () => {
    expect(toBaseUnitsPartial("12.5", 6)).toBe(toBaseUnits("12.5", 6));
    expect(toBaseUnitsPartial("0.000001", 6)).toBe(toBaseUnits("0.000001", 6));
  });

  it("survives what a keypad produces mid-type", () => {
    expect(toBaseUnitsPartial("0.", 6)).toBe(BigInt(0));
    expect(toBaseUnitsPartial("12.", 6)).toBe(toBaseUnits("12", 6));
    expect(toBaseUnitsPartial(".5", 6)).toBe(toBaseUnits("0.5", 6));
    expect(toBaseUnitsPartial(".", 6)).toBeNull();
    expect(toBaseUnitsPartial("", 6)).toBeNull();
  });

  it("still refuses text that is not a number at all", () => {
    expect(toBaseUnitsPartial("abc", 6)).toBeNull();
    expect(toBaseUnitsPartial("1.2.3", 6)).toBeNull();
    expect(toBaseUnitsPartial("-5", 6)).toBeNull();
    // …where the strict one throws, which is what took the screen down.
    expect(() => toBaseUnits("0.", 6)).toThrow();
  });
});
