import { describe, it, expect } from "vitest";
import { groupByDay, summarizeDays, activeDays, dailyPortfolioValue, trimLeadingEmpty } from "@oxar/sdk";

const DAY = 1_773_273_600;
const D = 86_400;

// A realistic little history: fund, buy, hold through a price move, sell some.
describe("numbers agree between the chart, the summary and the day list", () => {
  const points = [
    { t: DAY + D - 1, usd: 0 },
    { t: DAY + 2 * D - 1, usd: 100 },
    { t: DAY + 3 * D - 1, usd: 112 },
    { t: DAY + 4 * D - 1, usd: 90 },
  ];
  const events = [
    { timestamp: DAY + D + 100, kind: "buy", usd: 100 },
    { timestamp: DAY + 3 * D + 100, kind: "sell", usd: 25 },
  ];
  const days = groupByDay(events, points);
  const stats = summarizeDays(days);

  it("the last day's value is what the chart's last point draws", () => {
    expect(days[0]!.usd).toBe(points[points.length - 1]!.usd);
    expect(stats.endUsd).toBe(90);
  });

  it("the day-on-day changes sum to the range change", () => {
    const summed = days.reduce((n, d) => n + (d.changeUsd ?? 0), 0);
    expect(summed).toBeCloseTo(stats.changeUsd!, 8);
  });

  it("in and out match the events, not the value moves", () => {
    expect(stats.inUsd).toBe(100);
    expect(stats.outUsd).toBe(25);
    expect(stats.trades).toBe(2);
  });

  it("filtering quiet days out of the LIST leaves the summary untouched", () => {
    expect(activeDays(days)).toHaveLength(2);
    expect(summarizeDays(days).changeUsd).toBe(90);
  });
});

// Backward replay subtracts float deltas from a float balance, so the days before
// the first trade come out as residue (~1e-13 dollars), not exact zero. Residue that
// leaks through reads as "the portfolio started at almost nothing" and turns the
// range percent into quintillions.
describe("float residue does not pass for a held portfolio", () => {
  it("clamps residue days to zero so the leading run is trimmed", () => {
    const pts = dailyPortfolioValue({
      now: DAY + 4 * D,
      days: 4,
      // The route sums the balance from the same deltas, so mirror that here:
      // (0.1 + 0.2) − 0.1 − 0.2 replays to +4.2e-17, which is > 0.
      balancesNow: { GOLD: 0.1 + 0.2 },
      deltas: [
        { mint: "GOLD", timestamp: DAY + 2 * D + 10, delta: 0.1 },
        { mint: "GOLD", timestamp: DAY + 3 * D + 10, delta: 0.2 },
      ],
      prices: { GOLD: [{ t: DAY, price: 3000 }] },
    });
    expect(pts[0]!.usd).toBe(0);
    expect(pts[1]!.usd).toBe(0);
    // With the dust days true zeros, the trim drops all but one "from nothing" point.
    expect(trimLeadingEmpty(pts)).toHaveLength(3);
  });

  it("reports no percent when the range starts from dust", () => {
    const days = groupByDay(
      [],
      [
        { t: DAY + D - 1, usd: 8.9e-15 },
        { t: DAY + 2 * D - 1, usd: 85.63 },
      ],
    );
    const stats = summarizeDays(days);
    expect(stats.changeUsd).toBeCloseTo(85.63, 6);
    expect(stats.changePct).toBeNull();
  });
});

// The chart's own reconstruction: value = holdings that day × that day's price.
describe("portfolio value replay", () => {
  it("prices holdings as of each day and ends at today's balance", () => {
    const pts = trimLeadingEmpty(
      dailyPortfolioValue({
        now: DAY + 3 * D,
        days: 3,
        balancesNow: { GOLD: 2 },
        deltas: [{ mint: "GOLD", timestamp: DAY + D + 10, delta: 2 }],
        prices: {
          // SECONDS, matching DefiLlama's chart API (verified: 10-digit timestamps).
          // Passing milliseconds here makes every point look like the future, so
          // priceAt falls back to the earliest price for every day — a silently
          // wrong chart rather than an error.
          GOLD: [
            { t: DAY + D, price: 50 },
            { t: DAY + 2 * D, price: 60 },
            { t: DAY + 3 * D, price: 70 },
          ],
        },
      }),
    );
    expect(pts.length).toBeGreaterThan(0);
    // Bought 2 on day+1; the final point must be 2 × the latest price.
    expect(pts[pts.length - 1]!.usd).toBeCloseTo(140, 6);
    // Before the purchase the portfolio was empty, not back-filled with today's size.
    expect(pts[0]!.usd).toBeLessThan(140);
  });
});
