"use client";

import { useEffect, useState } from "react";

import { contentBand, type Band } from "@/lib/tour/geometry";

/** Used only if the header isn't on the page — its real height is measured. */
const FALLBACK_HEADER = 64;

/**
 * The strip of screen the tour may light up: viewport minus the sticky header,
 * minus the tab bar.
 *
 * Measured from the DOM rather than assumed, because both differ by breakpoint —
 * the tab bar is `md:hidden`, and a hidden element reports zero height, which is
 * exactly the answer we want on desktop.
 */
export function useContentBand(): Band {
  const [band, setBand] = useState<Band>({ top: 0, bottom: 0 });

  useEffect(() => {
    const measure = () => {
      const header = document.querySelector('[data-tour-chrome="header"]');
      const tabBar = document.querySelector('[data-tour-chrome="tabbar"]');
      const next = contentBand(
        window.innerHeight,
        header ? header.getBoundingClientRect().height : FALLBACK_HEADER,
        tabBar ? tabBar.getBoundingClientRect().height : 0,
      );
      setBand((prev) => (prev.top === next.top && prev.bottom === next.bottom ? prev : next));
    };

    measure();
    let raf = requestAnimationFrame(function loop() {
      measure();
      raf = requestAnimationFrame(loop);
    });
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return band;
}
