import { describe, it, expect } from "vitest";

import { portfolioSeries, priceAt } from "@oxar/sdk";

const DAY = 86_400;
const NOW = 1_785_000_000;
const AVGO = "XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo";

/** A flat price series covering the window. */
const flat = (price: number, days = 10) =>
  Array.from({ length: days }, (_, i) => ({ t: NOW - (days - 1 - i) * DAY, price }));

const valued = (params: Parameters<typeof portfolioSeries>[0]) =>
  portfolioSeries(params).map((d) => d.usd);

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
    expect(
      valued({
        now: NOW,
        days: 3,
        balancesNow: { [AVGO]: 2 },
        txs: [],
        prices: { [AVGO]: flat(10) },
      }),
    ).toEqual([20, 20, 20]);
  });

  // A day is valued at its END, so a purchase counts on the day it happened.
  it("shows a purchase from the day it happened, not the next one", () => {
    expect(
      valued({
        now: NOW,
        days: 3,
        balancesNow: { [AVGO]: 2 },
        // 60s BEFORE the middle day closes → held when that day ends.
        txs: [{ timestamp: NOW - DAY - 60, legs: { [AVGO]: 2 } }],
        prices: { [AVGO]: flat(10) },
      }),
    ).toEqual([0, 20, 20]);
  });

  it("does not count a purchase made after that day closed", () => {
    expect(
      valued({
        now: NOW,
        days: 3,
        balancesNow: { [AVGO]: 2 },
        txs: [{ timestamp: NOW - DAY + 60, legs: { [AVGO]: 2 } }],
        prices: { [AVGO]: flat(10) },
      }),
    ).toEqual([0, 0, 20]);
  });

  it("puts a sold position back on the earlier days", () => {
    expect(
      valued({
        now: NOW,
        days: 3,
        balancesNow: { [AVGO]: 0 },
        txs: [{ timestamp: NOW - 60, legs: { [AVGO]: -5 } }],
        prices: { [AVGO]: flat(10) },
      }),
    ).toEqual([50, 50, 0]);
  });

  it("adds several assets together", () => {
    const GOLD = "AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P";
    expect(
      valued({
        now: NOW,
        days: 1,
        balancesNow: { [AVGO]: 2, [GOLD]: 0.5 },
        txs: [],
        prices: { [AVGO]: flat(10), [GOLD]: flat(4000) },
      }),
    ).toEqual([2020]);
  });
});
