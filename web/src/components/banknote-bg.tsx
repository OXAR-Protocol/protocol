// Faint banknote-engraving texture for asset cards (dollar/euro/hryvnia).
// Rotated per asset by a stable hash of the seed so each asset keeps one bill.
// On hover (the card must carry `group`) the engraving lifts in opacity and a soft
// brand-violet glow warms the banknote side.

const NOTES = ["/art/note-usd.webp", "/art/note-eur.webp", "/art/note-uah.webp"];

/** Stable pick of a banknote for a seed (asset id / name). */
export function noteFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  return NOTES[Math.abs(h) % NOTES.length];
}

/**
 * Drop into a card that is `relative isolate overflow-hidden group`. Renders the
 * engraving + hover glow as absolute layers behind the content (they use -z-10, so
 * the card's own in-flow content paints on top without any per-child z tweaks).
 */
export function BanknoteBg({ seed }: { seed: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={noteFor(seed)}
        alt=""
        aria-hidden
        loading="lazy"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover object-right opacity-[0.06] transition-opacity duration-300 group-hover:opacity-[0.16] [mask-image:linear-gradient(to_left,#000,transparent_72%)]"
      />
      {/* brand-violet glow that warms in on hover, over the banknote side */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 top-1/2 -z-10 h-52 w-52 -translate-y-1/2 rounded-full bg-[#3c05c7] opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-[0.18]"
      />
    </>
  );
}
