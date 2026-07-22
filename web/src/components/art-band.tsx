"use client";

/**
 * Decorative pitch-collage art anchored at the bottom of a screen. Non-interactive,
 * dimmed, and masked so it fades into the page — an editorial footer motif, not a
 * focal image. Uses the transparent-PNG collages from the pitch deck (see /public/art).
 */
export function ArtBand({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={`pointer-events-none mt-16 flex justify-center select-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        className="h-auto w-full max-w-[460px] opacity-[0.16] [mask-image:linear-gradient(to_bottom,transparent,#000_28%,#000_72%,transparent)]"
      />
    </div>
  );
}
