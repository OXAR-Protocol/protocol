import { describe, it, expect } from "vitest";

import { en } from "./en";

/**
 * The interpolation rule, pinned. It used to use `String.replace`, which swaps only
 * the first match — so "{n} assets = {n} transactions" rendered its second
 * placeholder literally, braces and all, on screen.
 */
function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

describe("translation interpolation", () => {
  it("replaces EVERY occurrence of a placeholder, not just the first", () => {
    expect(interpolate("{n} assets = {n} transactions", { n: 4 })).toBe("4 assets = 4 transactions");
  });

  it("handles several distinct placeholders", () => {
    expect(interpolate("{a} then {b} then {a}", { a: "x", b: "y" })).toBe("x then y then x");
  });

  it("leaves a string with no placeholders alone", () => {
    expect(interpolate("nothing to fill", { n: 1 })).toBe("nothing to fill");
  });

  // Guards the case that started this: a repeated placeholder shipped in the
  // dictionary. Vars are derived from each string's OWN placeholders, so this tests
  // interpolation rather than whether this test happens to know every caller.
  it("fills every placeholder in every dictionary string, however often it repeats", () => {
    for (const [key, value] of Object.entries(en)) {
      const names = [...(value as string).matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1]!);
      if (!names.length) continue;
      const vars = Object.fromEntries(names.map((n) => [n, "X"]));
      const out = interpolate(value as string, vars);
      expect(out, `${key} left a brace behind`).not.toMatch(/\{[a-zA-Z]+\}/);
    }
  });

  it("catches a repeat in the real dictionary entry that exposed this", () => {
    expect(interpolate(en["alloc.note"], { n: 4 })).toBe("4 assets = 4 transactions");
  });
});
