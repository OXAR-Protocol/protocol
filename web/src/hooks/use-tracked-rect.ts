"use client";

import { useEffect, useState } from "react";

import type { Box } from "@/lib/tour/geometry";

const sameBox = (a: Box, b: Box) =>
  a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;

const toBox = (el: HTMLElement): Box => {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

/**
 * Live bounding boxes of the elements a tour step is pointing at, kept in sync
 * while they're tracked. Feeds both the spotlight's cut-outs and the card's
 * position, so a page scrolling or resizing under the tour never leaves either
 * one behind.
 *
 * Plural because a step can introduce several things at once — the catalog step
 * points at savings, stocks and gold, and highlighting only the first of them
 * made the copy promise three things the screen showed one of.
 *
 * Listeners catch the two events that most often move a target (scroll, resize)
 * immediately; the rAF loop is the safety net for everything else that shifts
 * layout without firing either — an image loading in, a fade-in animation, a
 * filter changing the list above the target.
 */
export function useTrackedRects(targets: readonly HTMLElement[]): Box[] {
  const [boxes, setBoxes] = useState<Box[]>([]);

  useEffect(() => {
    if (targets.length === 0) {
      setBoxes([]);
      return;
    }

    const measure = () => {
      setBoxes((prev) => {
        const next = targets.map(toBox);
        const unchanged =
          prev.length === next.length && next.every((b, i) => sameBox(b, prev[i]!));
        return unchanged ? prev : next;
      });
    };

    let raf = requestAnimationFrame(function loop() {
      measure();
      raf = requestAnimationFrame(loop);
    });

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
    // The array identity changes every render at the call site; its CONTENTS are
    // the real dependency, so compare those instead of re-opening the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets.length, ...targets]);

  return boxes;
}
