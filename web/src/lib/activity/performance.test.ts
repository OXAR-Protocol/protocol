import { describe, it, expect } from "vitest";
import {
  portfolioSeries,
  summarizePerformance,
  trimLeadingEmpty,
  type PerformanceDay,
} from "@oxar/sdk";

const D = 86_400;
const T = 1_800_000_000; // a fixed "now" — nothing here may depend on the wall clock

const flat = (price: number) => [{ t: T - 30 * D, price }];
/** Every displayed figure must reconcile: what changed is what you earned plus what moved. */
const identityHolds = (days: readonly PerformanceDay[]) => {
  const s = summarizePerformance(days);
  return Math.abs(s.endUsd! - s.startUsd! - (s.earnedUsd! + s.inUsd - s.outUsd)) < 1e-6;
};

/**
 * The scenario the design was validated against before a line of it was written: an
 * empty wallet takes in $100, spends it on a stock at a 1% spread, and the stock then
 * rises 5%. The honest answer is +$3.95 and +3.95% — getting in cost a dollar — and
 * nothing was ever withdrawn. A day-level view of the same history reports +$4.95 and
 * files that dollar as a withdrawal, which is why flows are read per transaction.
 */
describe("a deposit, a swap that costs a spread, and a price rise", () => {
  const days = portfolioSeries({
    now: T,
    days: 10,
    balancesNow: { USDC: 0, AAPL: 0.99 },
    txs: [
      { timestamp: T - 9.5 * D, legs: { USDC: 100 } }, // arrives from outside
      { timestamp: T - 8.5 * D, legs: { USDC: -100, AAPL: 0.99 } }, // $100 buys $99
    ],
    prices: {
      USDC: flat(1),
      AAPL: [
        { t: T - 30 * D, price: 100 },
        { t: T - 7 * D, price: 105 }, // +5%, the day after the purchase
      ],
    },
  });
  const stats = summarizePerformance(days);

  it("earns the market move minus what the exchange cost", () => {
    expect(stats.earnedUsd).toBeCloseTo(3.95, 6); // +4.95 price, −1.00 spread
  });

  it("counts only money that actually crossed the wallet's edge", () => {
    expect(stats.inUsd).toBeCloseTo(100, 6);
    expect(stats.outUsd).toBeCloseTo(0, 6);
  });

  it("returns the same 3.95% — the spread is a loss, not a withdrawal", () => {
    expect(stats.returnPct).toBeCloseTo(0.0395, 6); // 0.99 × 1.05 − 1
  });

  it("starts from nothing and ends at what is held", () => {
    expect(stats.startUsd).toBeCloseTo(0, 6);
    expect(stats.endUsd).toBeCloseTo(103.95, 6);
    expect(identityHolds(days)).toBe(true);
  });
});

describe("a percentage that survives every range", () => {
  // The 90-day and 1-year tabs open long before this wallet existed. Chaining daily
  // returns means they still report one, which measuring end-against-start could not.
  const openingOnAnEmptyWallet = portfolioSeries({
    now: T,
    days: 30,
    balancesNow: { GOLD: 2 },
    txs: [{ timestamp: T - 5.5 * D, legs: { GOLD: 2 } }],
    prices: {
      GOLD: [
        { t: T - 30 * D, price: 100 },
        { t: T - 4 * D, price: 110 },
      ],
    },
  });

  it("reports a return even though the range starts before the first deposit", () => {
    const s = summarizePerformance(openingOnAnEmptyWallet);
    expect(s.startUsd).toBeCloseTo(0, 6);
    expect(s.earnedUsd).toBeCloseTo(20, 6); // 2 × $10
    expect(s.returnPct).toBeCloseTo(0.1, 6); // the gold rose a tenth; so did the money
  });

  it("is not moved by the size of a deposit inside the range", () => {
    const hundredfold = portfolioSeries({
      now: T,
      days: 30,
      balancesNow: { GOLD: 200 },
      txs: [{ timestamp: T - 5.5 * D, legs: { GOLD: 200 } }],
      prices: {
        GOLD: [
          { t: T - 30 * D, price: 100 },
          { t: T - 4 * D, price: 110 },
        ],
      },
    });
    // A hundred times the money, the same performance.
    expect(summarizePerformance(hundredfold).returnPct).toBeCloseTo(0.1, 6);
    expect(summarizePerformance(hundredfold).earnedUsd).toBeCloseTo(2000, 6);
  });
});

describe("what we do not know, we do not draw", () => {
  it("stops where the transaction history stops instead of inventing a holding", () => {
    // We were handed a purchase of 5 units but hold only 1: the sale is off the end of
    // the window. Replaying past it would mean a negative holding, so those days are
    // simply not ours to report.
    const days = portfolioSeries({
      now: T,
      days: 10,
      balancesNow: { GOLD: 1 },
      txs: [{ timestamp: T - 2.5 * D, legs: { GOLD: 5 } }],
      prices: { GOLD: flat(100) },
    });
    expect(days).toHaveLength(2);
    expect(days.every((d) => d.usd >= 0)).toBe(true);
  });

  it("earns nothing on a mint nobody prices, rather than a number", () => {
    const days = portfolioSeries({
      now: T,
      days: 5,
      balancesNow: { MYSTERY: 1000 },
      txs: [{ timestamp: T - 4.5 * D, legs: { MYSTERY: 1000 } }],
      prices: {},
    });
    const s = summarizePerformance(days);
    expect(s.earnedUsd).toBe(0);
    expect(s.endUsd).toBe(0);
    expect(Number.isNaN(s.earnedUsd)).toBe(false);
  });

  it("treats float residue as the nothing it is", () => {
    // Undoing 0.1 then 0.2 from a balance of 0.3 leaves ~4e-17, not zero. Left alone
    // that is a day the chart draws as "held almost nothing".
    const days = portfolioSeries({
      now: T,
      days: 6,
      balancesNow: { GOLD: 0.1 + 0.2 },
      txs: [
        { timestamp: T - 2.5 * D, legs: { GOLD: 0.1 } },
        { timestamp: T - 1.5 * D, legs: { GOLD: 0.2 } },
      ],
      prices: { GOLD: flat(3000) },
    });
    expect(days).toHaveLength(6);
    expect(days.slice(0, 3).every((d) => d.usd === 0)).toBe(true);
    // Three empty days collapse to one, so the first purchase still reads as a rise
    // from nothing without a week of flat line in front of it.
    expect(trimLeadingEmpty(days)).toHaveLength(4);
  });
});

describe("moving money between your own things is not a flow", () => {
  it("reads a deposit into a yield source as internal, and its interest as earnings", () => {
    // $100 of USDC becomes 100 jlUSDC at $1.00; the receipt token then appreciates to
    // $1.05 — which is how Jupiter Lend pays. Nothing entered or left the wallet.
    const days = portfolioSeries({
      now: T,
      days: 10,
      balancesNow: { USDC: 0, JL: 100 },
      txs: [
        { timestamp: T - 9.5 * D, legs: { USDC: 100 } },
        { timestamp: T - 8.5 * D, legs: { USDC: -100, JL: 100 } },
      ],
      prices: {
        USDC: flat(1),
        JL: [
          { t: T - 30 * D, price: 1 },
          { t: T - 7 * D, price: 1.05 },
        ],
      },
    });
    const s = summarizePerformance(days);
    expect(s.inUsd).toBeCloseTo(100, 6); // the $100 that arrived, once
    expect(s.outUsd).toBeCloseTo(0, 6); // the deposit is not a withdrawal
    expect(s.earnedUsd).toBeCloseTo(5, 6); // interest, read off the price
    expect(s.returnPct).toBeCloseTo(0.05, 6);
    expect(identityHolds(days)).toBe(true);
  });
});
