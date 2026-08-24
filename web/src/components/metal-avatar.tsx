"use client";

/**
 * The account, as a disc of brushed metal.
 *
 * What it replaces: a flat plate whose colour was picked by hashing the wallet
 * address into four options — violet, black, amber, green. That made the most
 * saturated element on a money screen a coin flip, and put a `#b45309` orange in a
 * palette that has no orange anywhere else in it.
 *
 * What it is instead: the material already on the home screen. The app icon is the
 * mark in white on dark spun metal, and it is the one piece of OXAR that people
 * already recognise before the app opens. Carrying that surface inside means the
 * avatar stops being a random colour and starts being the product.
 *
 * The finishes are all near-achromatic on purpose. An avatar carries no information
 * — it is not a rank, it is not a balance — so it has no business being the loudest
 * thing on screen. Metal lets it be distinctive without being loud: you can tell two
 * accounts apart by the sweep and the tint, at a fraction of the shout that four
 * saturated hues cost.
 *
 * Drawn in CSS rather than shipped as images: four gradients cost nothing, scale to
 * any size, and stay sharp on every display. The conic gradient is what reads as
 * turned metal; the radial over it is the specular highlight; the inset shadows are
 * the rim and the fall-off at the bottom of a curved surface.
 */

interface Finish {
  /** Where the conic sweep starts — rotating it moves the highlight around the disc. */
  from: number;
  /** Dark, mid, darkest, brightest. The sweep runs through them and back. */
  a: string;
  b: string;
  c: string;
  d: string;
}

/** Six finishes, ordered darkest to warmest. Deliberately low-chroma throughout. */
const FINISHES: readonly Finish[] = [
  { from: 205, a: "#33383f", b: "#868d97", c: "#191c21", d: "#c2c8d0" }, // graphite
  { from: 155, a: "#343c45", b: "#96a0ab", c: "#1e2229", d: "#d0d7de" }, // steel
  { from: 285, a: "#3a3630", b: "#9a9184", c: "#1f1d19", d: "#cfc7b8" }, // pewter
  { from: 95, a: "#2a352e", b: "#7f9186", c: "#161d19", d: "#bccbc1" }, // verdigris
  { from: 340, a: "#3b332f", b: "#a08c81", c: "#211b18", d: "#d5c4ba" }, // bronze
  { from: 240, a: "#32343f", b: "#8a8ea5", c: "#1a1b23", d: "#c5c8d8" }, // gunmetal
];

/** Same seed in, same finish out — an account looks the same on every visit. */
function finishFor(seed: string): Finish {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FINISHES[hash % FINISHES.length]!;
}

export function MetalAvatar({
  seed,
  size = 40,
  className = "",
}: {
  /** Wallet address, or anything stable about the account. */
  seed: string;
  /** Diameter in px. */
  size?: number;
  className?: string;
}) {
  const f = finishFor(seed);

  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `
          radial-gradient(85% 65% at 32% 16%, rgba(255,255,255,0.32), rgba(255,255,255,0) 62%),
          conic-gradient(from ${f.from}deg at 50% 50%, ${f.a}, ${f.b}, ${f.c}, ${f.d}, ${f.c}, ${f.b}, ${f.a})
        `,
        // The rim catches light at the top and the surface falls away at the bottom —
        // the two shadows are what stop a flat gradient from reading as a sticker.
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.28),
          inset 0 ${-Math.round(size * 0.18)}px ${Math.round(size * 0.28)}px rgba(0,0,0,0.42),
          inset 0 0 0 1px rgba(255,255,255,0.07)
        `,
      }}
    >
      {/* The mark, at the same proportion of the disc as on the home-screen icon.
          Painted through a mask rather than loaded as an `<img>`: the shape is the
          only thing wanted from the file, so this draws it in whatever colour is
          asked for, costs no image decode, and keeps the element out of Next's
          image pipeline (which does not optimise SVG anyway). */}
      <span
        className="relative"
        style={{
          width: size * 0.52,
          height: size * 0.52,
          background: "rgba(255,255,255,0.95)",
          maskImage: "url(/mark-white.svg)",
          WebkitMaskImage: "url(/mark-white.svg)",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
        }}
      />
    </span>
  );
}
