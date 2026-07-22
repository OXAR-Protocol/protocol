"use client";

/**
 * Full pitch-collage art as an editorial sign-off at the bottom of a screen — shown
 * whole (not cropped or faded), with the brand line beneath it. Non-interactive.
 * Uses the transparent-PNG collages from the pitch deck (see /public/art).
 */
export function ArtBand({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  return (
    <div aria-hidden className="mt-20 flex select-none flex-col items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" className="h-auto w-full max-w-[300px]" />
      {caption && (
        <p className="mt-5 lowercase text-[11px] tracking-[0.28em] text-black/30">{caption}</p>
      )}
    </div>
  );
}
