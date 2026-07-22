/**
 * Full-width photo footer at the very bottom of the app pages — the torn-paper
 * dollar-bill eyes, with the top edge fading smoothly out of the page (white →
 * transparent) so it blends like the block backgrounds. Purely decorative.
 */
export function PhotoFooter() {
  return (
    <div
      aria-hidden
      className="relative mt-16 mb-16 h-32 w-full select-none overflow-hidden md:mb-0 md:h-44"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/torn-eyes.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* smooth transition: the page (white) melts down into the photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/55 to-transparent" />
    </div>
  );
}
