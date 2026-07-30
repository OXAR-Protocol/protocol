import { describe, expect, it } from "vitest";

import {
  bandHeight,
  boxBottom,
  clampToBand,
  contentBand,
  intersects,
  placeCard,
  scrollDelta,
  unionBox,
  type Box,
} from "./geometry";

const box = (top: number, height: number, left = 0, width = 400): Box => ({ top, left, width, height });

/** A phone: 800 tall, 64 of sticky header, 64 of tab bar. */
const VIEWPORT = 800;
const BAND = contentBand(VIEWPORT, 64, 64);
const GAP = 12;

describe("contentBand", () => {
  it("excludes the header and the tab bar", () => {
    expect(BAND).toEqual({ top: 64, bottom: 736 });
  });

  it("collapses rather than inverting when the chrome is taller than the screen", () => {
    const band = contentBand(100, 80, 80);
    expect(band.bottom).toBeGreaterThanOrEqual(band.top);
    expect(bandHeight(band)).toBe(0);
  });
});

describe("clampToBand", () => {
  it("trims a section that starts under the sticky header", () => {
    // The reported bug: the rect began above the header's bottom edge, so the
    // header sat inside the lit cut-out.
    const clamped = clampToBand(box(20, 300), BAND);
    expect(clamped).not.toBeNull();
    expect(clamped!.top).toBe(BAND.top);
    expect(boxBottom(clamped!)).toBe(320);
  });

  it("trims a section that runs under the tab bar", () => {
    const clamped = clampToBand(box(700, 300), BAND);
    expect(boxBottom(clamped!)).toBe(BAND.bottom);
  });

  it("returns null for a box entirely outside the band", () => {
    expect(clampToBand(box(0, 40), BAND)).toBeNull();
    expect(clampToBand(box(760, 40), BAND)).toBeNull();
  });
});

describe("unionBox", () => {
  it("spans several holes", () => {
    const u = unionBox([box(100, 40, 10, 100), box(300, 40, 40, 200)]);
    expect(u).toEqual({ top: 100, left: 10, width: 230, height: 240 });
  });

  it("is null with nothing to span", () => {
    expect(unionBox([])).toBeNull();
  });
});

describe("placeCard + scrollDelta", () => {
  /** The invariant that was broken: the card must not cover the highlight. */
  const cardBox = (side: "top" | "bottom", h: number): Box =>
    side === "bottom"
      ? { top: BAND.bottom - h, left: 0, width: 400, height: h }
      : { top: BAND.top, left: 0, width: 400, height: h };

  it("takes the roomier end of the band", () => {
    expect(placeCard(box(100, 80), BAND, 180, GAP).side).toBe("bottom");
    expect(placeCard(box(600, 80), BAND, 180, GAP).side).toBe("top");
  });

  it("leaves the highlight the rest of the band", () => {
    const { area } = placeCard(box(100, 80), BAND, 180, GAP);
    expect(area).toEqual({ top: 64, bottom: 736 - 192 });
  });

  it("scrolls a short target to the middle of what's left, clear of the card", () => {
    const target = box(600, 80);
    const { side, area } = placeCard(target, BAND, 180, GAP);
    const moved = { ...target, top: target.top - scrollDelta(target, area, GAP) };
    expect(intersects(moved, cardBox(side, 180))).toBe(false);
    expect(moved.top).toBeGreaterThanOrEqual(area.top);
    expect(boxBottom(moved)).toBeLessThanOrEqual(area.bottom);
  });

  it("aligns a target taller than the room to its TOP, so the section's start shows", () => {
    // The history step: a section taller than the space above the card was
    // centred, which put its heading and first rows behind the card.
    const target = box(500, 900);
    const { side, area } = placeCard(target, BAND, 180, GAP);
    const moved = { ...target, top: target.top - scrollDelta(target, area, GAP) };
    expect(moved.top).toBe(area.top + GAP);
    expect(intersects(moved, cardBox(side, 180))).toBe(false);
  });

  it("never scrolls when the card leaves no room at all", () => {
    const { area } = placeCard(box(100, 80), BAND, bandHeight(BAND) + 100, GAP);
    expect(scrollDelta(box(100, 80), area, GAP)).toBe(0);
  });
});

describe("intersects", () => {
  it("ignores boxes that only share an edge", () => {
    expect(intersects(box(0, 100), box(100, 100))).toBe(false);
  });

  it("catches a real overlap", () => {
    expect(intersects(box(0, 100), box(90, 100))).toBe(true);
  });
});
