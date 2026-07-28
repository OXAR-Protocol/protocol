/**
 * One answer to "which way is this line going, and what colour is that".
 *
 * The rule and the two class strings had been written out at every chart: the two
 * yield rows, the yield card, the stock rows and cards, the portfolio cards. Six
 * copies of a ternary is six chances for green to start meaning different things in
 * different corners of the same page.
 *
 * Presentation, not money — hence `web/` rather than `@oxar/sdk`, whose rule covers
 * framework-agnostic MONEY-PATH logic. Tailwind class names would have no business
 * in a package that also runs on mobile.
 */

/** Did the series end above where it started? Flat counts as up, matching the way a
 *  0.00% price change is already treated everywhere else. */
export function trendUp(series: readonly number[]): boolean {
  return series.length > 1 && series[series.length - 1]! >= series[0]!;
}

/** Line colour for a trend chart. Muted — it sits behind the figure, not beside it. */
export function trendLineTone(up: boolean): string {
  return up ? "text-emerald-400/40" : "text-red-400/40";
}

/** Text colour for a figure that carries the same direction (a % change, a delta). */
export function trendTextTone(up: boolean): string {
  return up ? "text-emerald-600" : "text-red-600";
}
