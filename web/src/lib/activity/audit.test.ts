import { describe, it, expect } from "vitest";
import { groupByDay, countActivity, portfolioSeries, summarizePerformance } from "@oxar/sdk";

import { costBasisFromSwaps, type HeliusTx } from "@/lib/earnings/swaps";
import { CASH_MINTS } from "@/lib/yield/position-mints";

const D = 86_400;
const T = 1_800_000_000;
const OWNER = "owner";
const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const AAPL = "aapl";

/** One history, two readings — so neither test can quietly use a friendlier input. */
const HISTORY = [
  // $100 of USDT arrives from outside.
  { timestamp: T - 9.5 * D, legs: { [USDT]: 100 } },
  // …and buys 1 AAPL. The market price is $99, so getting in costs a dollar.
  { timestamp: T - 8.5 * D, legs: { [USDT]: -100, [AAPL]: 1 } },
];

const asHelius = (): HeliusTx[] =>
  HISTORY.map((tx) => ({
    timestamp: tx.timestamp,
    tokenTransfers: Object.entries(tx.legs).map(([mint, amount]) => ({
      mint,
      tokenAmount: Math.abs(amount),
      ...(amount > 0 ? { toUserAccount: OWNER } : { fromUserAccount: OWNER }),
    })),
  }));

const PRICES = {
  [USDT]: [{ t: T - 30 * D, price: 1 }],
  [AAPL]: [
    { t: T - 30 * D, price: 99 },
    { t: T - 7 * D, price: 110 }, // ends the range worth $110
  ],
};

/**
 * Two engines, one truth.
 *
 * The home screen answers "what has this position made since I bought it" from swap
 * cost basis; the portfolio card answers "what did the money make over this period"
 * from the value series. They are computed from different data by different methods,
 * and they appear on the same screen — so if they can disagree, one of them is lying
 * to someone. Over a wallet's whole history they must land on the same number.
 */
describe("the two ways of saying what you earned agree", () => {
  const held = 1;
  const finalPrice = 110;

  it("agrees on a purchase settled in USDT", () => {
    const invested = costBasisFromSwaps(asHelius(), OWNER, AAPL, CASH_MINTS).basis;
    const costBasisEarned = held * finalPrice - invested;

    const performance = summarizePerformance(
      portfolioSeries({
        now: T,
        days: 10,
        balancesNow: { [USDT]: 0, [AAPL]: held },
        txs: HISTORY,
        prices: PRICES,
      }),
    );

    // Paid $100 for something now worth $110.
    expect(invested).toBe(100);
    expect(costBasisEarned).toBeCloseTo(10, 6);
    expect(performance.earnedUsd).toBeCloseTo(costBasisEarned, 6);
  });

  // The agreement above is load-bearing on reading EVERY dollar leg. Told to look for
  // USDC alone — as the cost-basis engine was — the same purchase looks free, and a
  // position bought with $100 reports the whole $110 as profit.
  it("would not agree if only one settlement token were read", () => {
    const usdcOnly = costBasisFromSwaps(asHelius(), OWNER, AAPL, new Set([USDC]));
    expect(usdcOnly.basis).toBe(0);
    expect(held * finalPrice - usdcOnly.basis).toBeCloseTo(110, 6); // the phantom profit
    // …which is exactly why an unexplained holding is now reported as uncovered:
    // the figure is never shown rather than shown wrong.
    expect(usdcOnly.covered).toBe(false);
    expect(CASH_MINTS.has(USDT)).toBe(true);
  });
});

describe("the day list and the series it is drawn from", () => {
  const series = portfolioSeries({
    now: T,
    days: 10,
    balancesNow: { [USDT]: 0, [AAPL]: 1 },
    txs: HISTORY,
    prices: PRICES,
  });

  it("shows each day the earnings the series computed, not a value delta", () => {
    const days = groupByDay(
      [{ timestamp: T - 8.5 * D, kind: "buy", usd: 100 }],
      series,
    );
    const summed = days.reduce((n, d) => n + (d.earnedUsd ?? 0), 0);
    expect(summed).toBeCloseTo(summarizePerformance(series).earnedUsd!, 6);
    // The day the money arrived rose $100 in value and earned none of it.
    const arrival = days.find((d) => d.inUsd > 0);
    expect(arrival?.earnedUsd).not.toBe(100);
  });

  it("leaves counting to the feed and money to the series", () => {
    const days = groupByDay(
      [
        { timestamp: T - 8.5 * D, kind: "buy", usd: null }, // unpriceable, still a trade
        { timestamp: T - 8.4 * D, kind: "sell", usd: 5 },
      ],
      series,
    );
    expect(countActivity(days)).toEqual({ trades: 2, activeDays: 1 });
  });
});
