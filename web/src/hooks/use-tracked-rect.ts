"use client";

import { useEffect, useState } from "react";

/**
 * Live bounding rect of an element, kept in sync while it's tracked. Feeds both
 * the tour spotlight's cut-out and the tour card's position, so a page
 * scrolling or resizing under the tour never leaves either one behind.
 *
 * Listeners catch the two events that most often move a target (scroll,
 * resize) immediately; the rAF loop is the safety net for everything else that
 * shifts layout without firing either — an image loading in, a fade-in
 * animation, a filter changing the list above the target.
 */
export function useTrackedRect(target: HTMLElement | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }

    const measure = () => {
      setRect((prev) => {
        const next = target.getBoundingClientRect();
        if (
          prev &&
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev;
        }
        return next;
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
  }, [target]);

  return rect;
}
