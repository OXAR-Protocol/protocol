"use client";

/**
 * Pitch-collage photo as a full-bleed block background, with a white legibility scrim
 * on top so the block's copy stays readable. Drop it as the FIRST child of a
 * `relative overflow-hidden` container, then put the real content in a sibling wrapped
 * in `relative` so it sits above. Adds no height — purely absolute layers.
 *
 * scrim:
 *  - "left"   solid white under a left-aligned column, clearing to the right (photo shows right)
 *  - "center" white in the middle for centered content, photo peeking at the edges
 */
const SCRIMS = {
  left: "bg-[linear-gradient(to_right,#ffffff_0%,#ffffff_40%,rgba(255,255,255,0.5)_64%,rgba(255,255,255,0)_92%)]",
  center:
    "bg-[radial-gradient(120%_100%_at_50%_50%,#ffffff_0%,#ffffff_34%,rgba(255,255,255,0.45)_100%)]",
} as const;

export function PhotoBg({
  src,
  scrim = "left",
  position = "object-right",
}: {
  src: string;
  scrim?: keyof typeof SCRIMS;
  /** Tailwind object-position utility, e.g. "object-right", "object-center". */
  position?: string;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        className={`pointer-events-none absolute inset-0 h-full w-full select-none object-cover ${position}`}
      />
      <div aria-hidden className={`absolute inset-0 ${SCRIMS[scrim]}`} />
    </>
  );
}
