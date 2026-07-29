"use client";

import { useEffect } from "react";

import { useTrackedRect } from "@/hooks/use-tracked-rect";

/** Breathing room between the cut-out and the target it's framing. */
const PAD = 8;

/**
 * Full-screen dim with a cut-out over the target's rect — the box-shadow trick:
 * a div sized exactly to the target casts a huge shadow that reads as a dark
 * overlay everywhere else, no SVG mask needed. Purely visual (pointer-events
 * disabled): the tour is driven by the card's own back/next/skip, never by
 * clicking through to the app underneath.
 */
export function TourSpotlight({ target }: { target: HTMLElement | null }) {
  const rect = useTrackedRect(target);

  // Bring the new target on screen the moment a step picks it — otherwise the
  // cut-out can land off-screen with nothing visible to explain.
  useEffect(() => {
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [target]);

  if (!rect) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[59] rounded-[10px] transition-[top,left,width,height] duration-200 ease-out"
      style={{
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
        outline: "2px solid rgba(255,255,255,0.85)",
        outlineOffset: 2,
      }}
    />
  );
}
