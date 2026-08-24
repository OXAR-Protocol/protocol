/**
 * The vertical scale a sparkline is drawn on, and the path that follows it.
 *
 * Two things a bare min→bottom / max→top mapping got wrong, both visible on the
 * portfolio chart:
 *
 * 1. The extremes landed exactly on the box edges, so the 1.5px stroke was sliced
 *    in half by the viewBox and the gradient fill ran flush into the top — the
 *    "stripes" above and below the line. `PAD` keeps the curve off the edges.
 *
 * 2. The domain always hugged the data, so ANY series filled the full height. A
 *    balance that moved −0.95% over a month was drawn as a fall from ceiling to
 *    floor. On a screen showing someone's money that is not zooming in, it is
 *    overstating. `MIN_SPAN_RATIO` gives the domain a floor relative to the value,
 *    so a small move looks small and only a real one fills the box.
 */

/** Breathing room above and below the curve, as a fraction of the height. */
const PAD = 0.06;

/** Narrowest domain we will draw, as a fraction of the series' own magnitude. */
const MIN_SPAN_RATIO = 0.03;

export interface SparklineDomain {
  min: number;
  max: number;
}

/** The value range a series is drawn against — its own, widened to `MIN_SPAN_RATIO`. */
export function sparklineDomain(values: number[]): SparklineDomain {
  if (!values || values.length === 0) return { min: 0, max: 0 };
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const mid = (lo + hi) / 2;
  // Zero only for an all-zero series, which `sparklineY` centers.
  const span = Math.max(hi - lo, Math.abs(mid) * MIN_SPAN_RATIO);
  return { min: mid - span / 2, max: mid + span / 2 };
}

/**
 * Where `value` sits vertically, as a fraction of the box: 0 = top, 1 = bottom,
 * already inset by `PAD`. The path and the hover dot both go through here, so the
 * marker can't drift off the line.
 */
export function sparklineY(value: number, domain: SparklineDomain): number {
  const span = domain.max - domain.min;
  if (span <= 0) return 0.5;
  const t = (value - domain.min) / span; // 0 at the bottom of the domain
  return PAD + (1 - t) * (1 - 2 * PAD);
}

/**
 * Build an SVG polyline path for a series of values within a `width`×`height` box.
 * Returns "" for fewer than 2 points. Coordinates are rounded to 2dp.
 */
export function sparklinePath(values: number[], width: number, height: number): string {
  if (!values || values.length < 2) return "";

  const domain = sparklineDomain(values);
  const stepX = width / (values.length - 1);

  const round = (n: number) => Number(n.toFixed(2));

  return values
    .map((v, i) => {
      const x = round(i * stepX);
      const y = round(sparklineY(v, domain) * height);
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");
}
