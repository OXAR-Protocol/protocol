"use client";

import { clampToBand, type Band, type Box } from "@/lib/tour/geometry";

/** Breathing room between a cut-out and the target it's framing. */
const PAD = 8;
const RADIUS = 10;

/**
 * The dim, with a hole punched over each thing this step is pointing at.
 *
 * An SVG mask rather than the usual `box-shadow: 0 0 0 9999px` trick, because
 * that trick only works for ONE hole: a second element casting its own huge
 * shadow would darken the first one's hole and double the dim everywhere else.
 * A mask composes any number of holes correctly.
 *
 * The overlay deliberately CAPTURES pointer events, including over the holes —
 * the holes are purely visual. During the walkthrough the tour is the thing
 * driving navigation, so letting taps reach the app underneath meant the two
 * fought each other for the router. Progress comes from the card's own
 * back/next/skip, and a stray tap on the dim does nothing rather than ending the
 * tour by accident.
 */
export function TourSpotlight({ holes, band }: { holes: readonly Box[]; band: Band }) {
  const visible = holes
    .map((h) =>
      clampToBand(
        { top: h.top - PAD, left: h.left - PAD, width: h.width + PAD * 2, height: h.height + PAD * 2 },
        band,
      ),
    )
    .filter((h): h is Box => h !== null);

  return (
    <svg
      aria-hidden
      className="fixed inset-0 z-[58] h-full w-full"
      // Swallows the tap without doing anything — see the note above.
      onPointerDown={(e) => e.preventDefault()}
    >
      <defs>
        <mask id="tour-cutout">
          <rect x={0} y={0} width="100%" height="100%" fill="white" />
          {visible.map((h, i) => (
            <rect
              key={i}
              x={h.left}
              y={h.top}
              width={h.width}
              height={h.height}
              rx={RADIUS}
              fill="black"
            />
          ))}
        </mask>
      </defs>

      <rect x={0} y={0} width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tour-cutout)" />

      {/* A hairline around each hole, so a lit area still reads as deliberate
          against a pale page rather than as the dim having failed. */}
      {visible.map((h, i) => (
        <rect
          key={i}
          x={h.left + 1}
          y={h.top + 1}
          width={Math.max(0, h.width - 2)}
          height={Math.max(0, h.height - 2)}
          rx={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
