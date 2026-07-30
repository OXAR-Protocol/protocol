/**
 * Rect arithmetic for the guided tour — pure, so the rules that were getting
 * broken on a real phone can be pinned by tests instead of by squinting at
 * screenshots.
 *
 * Two rules earn their own functions here, because both were violated by the
 * first version: a cut-out must never include the app's own chrome (the sticky
 * header ended up lit up), and the card must never cover the thing it points at
 * (the history step covered the history entirely).
 */

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** A horizontal strip of the viewport, in viewport coordinates. */
export interface Band {
  top: number;
  bottom: number;
}

export const boxBottom = (b: Box): number => b.top + b.height;
export const boxRight = (b: Box): number => b.left + b.width;
export const bandHeight = (b: Band): number => Math.max(0, b.bottom - b.top);

/**
 * The strip the tour is allowed to light up: the viewport minus the sticky
 * header and minus the tab bar. Highlighting either one is never the point —
 * they're the frame, not the content — and lighting the header made the app's
 * own name look like the subject of the step.
 */
export function contentBand(viewportHeight: number, headerHeight: number, tabBarHeight: number): Band {
  const top = Math.max(0, headerHeight);
  const bottom = Math.max(top, viewportHeight - Math.max(0, tabBarHeight));
  return { top, bottom };
}

/** `box` trimmed to `band`; null when nothing of it is left inside. */
export function clampToBand(box: Box, band: Band): Box | null {
  const top = Math.max(box.top, band.top);
  const bottom = Math.min(boxBottom(box), band.bottom);
  if (bottom <= top) return null;
  return { top, left: box.left, width: box.width, height: bottom - top };
}

export function unionBox(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null;
  const top = Math.min(...boxes.map((b) => b.top));
  const left = Math.min(...boxes.map((b) => b.left));
  const bottom = Math.max(...boxes.map(boxBottom));
  const right = Math.max(...boxes.map(boxRight));
  return { top, left, width: right - left, height: bottom - top };
}

export function intersects(a: Box, b: Box): boolean {
  return (
    a.left < boxRight(b) && boxRight(a) > b.left && a.top < boxBottom(b) && boxBottom(a) > b.top
  );
}

export type CardSide = "top" | "bottom";

export interface Placement {
  side: CardSide;
  /** What's left of the band for the highlight once the card has its room. */
  area: Band;
}

/**
 * Which end of the band the card takes, and the room that leaves the highlight.
 *
 * Decided from the target's position ONCE per step by the caller: recomputing it
 * after the scroll below would let the two chase each other, since scrolling the
 * target changes which side has more space.
 */
export function placeCard(target: Box, band: Band, cardHeight: number, gap: number): Placement {
  const roomAbove = target.top - band.top;
  const roomBelow = band.bottom - boxBottom(target);
  const side: CardSide = roomBelow >= roomAbove ? "bottom" : "top";
  return { side, area: cardArea(side, band, cardHeight, gap) };
}

/**
 * What's left of the band once the card takes `side`. Split out because the side
 * is chosen from a first, estimated card height and then kept, while the area is
 * recomputed from the height the card actually measured — recomputing the side
 * too would let it flip under the user mid-step.
 */
export function cardArea(side: CardSide, band: Band, cardHeight: number, gap: number): Band {
  const cost = cardHeight + gap;
  return side === "bottom"
    ? { top: band.top, bottom: Math.max(band.top, band.bottom - cost) }
    : { top: Math.min(band.bottom, band.top + cost), bottom: band.bottom };
}

/**
 * How far to scroll (positive scrolls the page down) so the target sits inside
 * the room the card left over.
 *
 * A target taller than that room is aligned to the TOP of it rather than
 * centred: what a section needs to show first is its heading and first rows, and
 * centring a tall section hid exactly those behind the card — the reported bug.
 */
export function scrollDelta(target: Box, area: Band, gap: number): number {
  const room = bandHeight(area);
  if (room <= 0) return 0;

  const wanted = target.height + gap * 2;
  if (wanted > room) return target.top - (area.top + gap);

  const centred = area.top + (room - target.height) / 2;
  return target.top - centred;
}
