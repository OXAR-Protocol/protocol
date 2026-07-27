import { describe, it, expect } from "vitest";

import { dailyPortfolioValue, priceAt, trimLeadingEmpty } from "@oxar/sdk";

const DAY = 86_400;
const NOW = 1_785_000_000;
const AVGO = "XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo";

/** A flat price series covering the window. */
const flat = (price: number, days = 10) =>
  Array.from({ length: days }, (_, i) => ({ t: NOW - (days - 1 - i) * DAY, price }));

describe("valuing a day", () => {
  it("uses the last price at or before that day", () => {
    const series = [
      { t: NOW - 2 * DAY, price: 100 },
      { t: NOW - DAY, price: 200 },
    ];
    expect(priceAt(series, NOW - 2 * DAY)).toBe(100);
    expect(priceAt(series, NOW)).toBe(200);
  });

  // A position older than our price data must still be valued, not dropped.
  it("falls back to the earliest known price before the series starts", () => {
    expect(priceAt([{ t: NOW, price: 50 }], NOW - 10 * DAY)).toBe(50);
  });

  it("values nothing when there is no price at all", () => {
    expect(priceAt([], NOW)).toBe(0);
  });
});

describe("replaying holdings backward", () => {
  it("holds the current balance flat when nothing moved", () => {
    const points = dailyPortfolioValue({
      now: NOW,
      days: 3,
      balancesNow: { [AVGO]: 2 },
      deltas: [],
      prices: { [AVGO]: flat(10) },
    });
    expect(points.map((p) => p.usd)).toEqual([20, 20, 20]);
  });

  // A day is valued at its END, so a purchase counts on the day it happened.
  it("shows a purchase from the day it happened, not the next one", () => {
    const points = dailyPortfolioValue({
      now: NOW,
      days: 3,
      balancesNow: { [AVGO]: 2 },
      // 60s BEFORE the middle day closes → held when that day ends.
      deltas: [{ mint: AVGO, timestamp: NOW - DAY - 60, delta: 2 }],
      prices: { [AVGO]: flat(10) },
    });
    expect(points.map((p) => p.usd)).toEqual([0, 20, 20]);
  });

  it("does not count a purchase made after that day closed", () => {
    const points = dailyPortfolioValue({
      now: NOW,
      days: 3,
      balancesNow: { [AVGO]: 2 },
      deltas: [{ mint: AVGO, timestamp: NOW - DAY + 60, delta: 2 }],
      prices: { [AVGO]: flat(10) },
    });
    expect(points.map((p) => p.usd)).toEqual([0, 0, 20]);
  });

  it("puts a sold position back on the earlier days", () => {
    const points = dailyPortfolioValue({
      now: NOW,
      days: 3,
      balancesNow: { [AVGO]: 0 },
      deltas: [{ mint: AVGO, timestamp: NOW - 60, delta: -5 }],
      prices: { [AVGO]: flat(10) },
    });
    expect(points.map((p) => p.usd)).toEqual([50, 50, 0]);
  });

  // Truncated history can imply a negative past balance. That isn't a thing, and
  // letting it through would drag the whole line below zero.
  it("never values a negative holding", () => {
    const points = dailyPortfolioValue({
      now: NOW,
      days: 2,
      balancesNow: { [AVGO]: 1 },
      deltas: [{ mint: AVGO, timestamp: NOW - 60, delta: 100 }],
      prices: { [AVGO]: flat(10) },
    });
    expect(points.every((p) => p.usd >= 0)).toBe(true);
  });

  it("adds several assets together", () => {
    const GOLD = "AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P";
    const points = dailyPortfolioValue({
      now: NOW,
      days: 1,
      balancesNow: { [AVGO]: 2, [GOLD]: 0.5 },
      deltas: [],
      prices: { [AVGO]: flat(10), [GOLD]: flat(4000) },
    });
    expect(points[0]!.usd).toBe(2020);
  });
});

describe("trimming the empty run", () => {
  // A month of zeros before the first deposit says nothing and flattens the rest.
  it("starts one day before the first holding", () => {
    const trimmed = trimLeadingEmpty([
      { t: 1, usd: 0 },
      { t: 2, usd: 0 },
      { t: 3, usd: 5 },
    ]);
    expect(trimmed).toEqual([{ t: 2, usd: 0 }, { t: 3, usd: 5 }]);
  });

  it("returns nothing when the wallet never held anything", () => {
    expect(trimLeadingEmpty([{ t: 1, usd: 0 }])).toEqual([]);
  });
});
