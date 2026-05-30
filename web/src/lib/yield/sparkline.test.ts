import { describe, it, expect } from "vitest";

import { sparklinePath } from "./sparkline";

describe("sparklinePath", () => {
  it("returns empty for fewer than 2 points", () => {
    expect(sparklinePath([], 100, 20)).toBe("");
    expect(sparklinePath([5], 100, 20)).toBe("");
  });

  it("maps min to the bottom and max to the top (SVG y grows downward)", () => {
    expect(sparklinePath([0, 10], 100, 20)).toBe("M 0,20 L 100,0");
    expect(sparklinePath([10, 0], 100, 20)).toBe("M 0,0 L 100,20");
  });

  it("centers a flat series", () => {
    expect(sparklinePath([5, 5, 5], 100, 20)).toBe("M 0,10 L 50,10 L 100,10");
  });

  it("spaces points evenly across the width", () => {
    expect(sparklinePath([0, 5, 10], 100, 20)).toBe("M 0,20 L 50,10 L 100,0");
  });
});
