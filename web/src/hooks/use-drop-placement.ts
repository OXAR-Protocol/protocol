"use client";

import { useEffect, useState, type RefObject } from "react";

/** The tab bar sits fixed over the bottom of the app on a phone. A menu that ends
 *  under it can't be scrolled into view — the menu is the thing that scrolls, not
 *  the page — so the last options are simply unreachable. Keep clear of it. */
const BOTTOM_GUARD = 88;
const TOP_GUARD = 16;
/** Below this a menu is more frustrating than useful, so take the overflow instead. */
const MIN_HEIGHT = 140;

export interface DropPlacement {
  /** Open upwards — there isn't room below the anchor. */
  up: boolean;
  /** How tall the menu may be, in px. */
  maxHeight: number;
}

/**
 * Where a dropdown anchored to `ref` should open, and how tall it may be.
 *
 * Measured against the viewport rather than the parent, so a picker near the
 * bottom of a phone flips up instead of running under the tab bar.
 */
export function useDropPlacement(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  preferred = 256,
): DropPlacement {
  const [placement, setPlacement] = useState<DropPlacement>({ up: false, maxHeight: preferred });

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - BOTTOM_GUARD;
      const above = rect.top - TOP_GUARD;
      const up = below < Math.min(preferred, above);
      const room = up ? above : below;
      setPlacement({ up, maxHeight: Math.min(preferred, Math.max(room, MIN_HEIGHT)) });
    };
    measure();
    window.addEventListener("resize", measure);
    // Capture: the page, a sheet or an inner list may be the thing that scrolls.
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, ref, preferred]);

  return placement;
}
