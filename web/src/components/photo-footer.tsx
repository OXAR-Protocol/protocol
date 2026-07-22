/**
 * Torn-paper dollar-bill eyes as a full-width background layer pinned to the bottom of
 * the page, sitting BEHIND the content (z-0). It starts well above the page bottom so
 * the last page elements overlap onto it; the top fades out of the page (white →
 * transparent) so the transition stays soft. Purely decorative.
 *
 * Place as the last child of a `relative` full-height container; give the content
 * column `relative z-10` so it renders on top.
 */
export function PhotoFooter() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[380px] select-none overflow-hidden md:h-[520px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/torn-eyes.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* smooth start: the page (white) melts down into the photo over the top third */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#ffffff_0%,rgba(255,255,255,0)_40%)]" />
    </div>
  );
}
