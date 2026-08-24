import { describe, it, expect } from "vitest";

import { sparklineDomain, sparklinePath, sparklineY } from "./sparkline";

/** PAD = 0.06 of the height, so over 20px the curve lives between y=1.2 and y=18.8. */
const TOP = 1.2;
const BOTTOM = 18.8;

describe("sparklinePath", () => {
  it("returns empty for fewer than 2 points", () => {
    expect(sparklinePath([], 100, 20)).toBe("");
    expect(sparklinePath([5], 100, 20)).toBe("");
  });

  it("maps min toward the bottom and max toward the top (SVG y grows downward)", () => {
    expect(sparklinePath([0, 10], 100, 20)).toBe(`M 0,${BOTTOM} L 100,${TOP}`);
    expect(sparklinePath([10, 0], 100, 20)).toBe(`M 0,${TOP} L 100,${BOTTOM}`);
  });

  // The extremes used to land on y=0 and y=height exactly, so the 1.5px stroke was
  // sliced in half by the viewBox edge and the fill ran flush into the top — read on
  // screen as stripes above and below the chart.
  it("keeps the curve clear of the box edges", () => {
    const d = sparklinePath([0, 10], 100, 20);
    expect(d).not.toContain(",0 ");
    expect(d).not.toMatch(/,0$/);
    expect(d).not.toContain(",20");
  });

  it("centers a flat series", () => {
    expect(sparklinePath([5, 5, 5], 100, 20)).toBe("M 0,10 L 50,10 L 100,10");
  });

  it("spaces points evenly across the width", () => {
    expect(sparklinePath([0, 5, 10], 100, 20)).toBe(`M 0,${BOTTOM} L 50,10 L 100,${TOP}`);
  });
});

describe("sparklineDomain", () => {
  it("uses the series' own range when it is wide enough", () => {
    expect(sparklineDomain([0, 10])).toEqual({ min: 0, max: 10 });
  });

  // A portfolio that moved −0.95% over a month was drawn falling from ceiling to
  // floor, because the domain always hugged the data. On a screen about someone's
  // money that overstates rather than zooms.
  it("widens a domain narrower than 3% of the value, keeping the data centered", () => {
    const d = sparklineDomain([3552.81, 3594.08]);
    expect(d.max - d.min).toBeCloseTo(3573.445 * 0.03, 6);
    expect((d.min + d.max) / 2).toBeCloseTo(3573.445, 6);
  });

  it("leaves a tiny move visible but small", () => {
    const d = sparklineDomain([3552.81, 3594.08]);
    const drop = sparklineY(3552.81, d) - sparklineY(3594.08, d);
    // A −1.15% move reads as roughly a third of the height, not the whole of it.
    expect(drop).toBeGreaterThan(0.2);
    expect(drop).toBeLessThan(0.45);
  });

  it("survives an all-zero series without dividing by zero", () => {
    expect(sparklineY(0, sparklineDomain([0, 0]))).toBe(0.5);
  });
});
