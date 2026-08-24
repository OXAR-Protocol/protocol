import { describe, expect, it } from "vitest";

import { portfolioSeries, type PriceSeries, type WalletTx } from "@oxar/sdk";

/**
 * The backward replay is only allowed to state what it can reconstruct.
 *
 * These cover the two directions history can be missing in. The negative-balance
 * case (an inflow we never saw) was already guarded; the case below it — an outflow
 * whose reconstruction simply grows the further back it goes — was not, and produced
 * a one-year chart opening at $5,840 on a two-month-old account.
 */

const DAY = 86_400;
/** A fixed "now" so the assertions don't drift with the clock. */
const NOW = 1_780_000_000;
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/** One dollar, every day, for as far back as anyone asks. */
const FLAT_PRICES: PriceSeries = {
  [USDC]: Array.from({ length: 400 }, (_, i) => ({ t: (NOW - (399 - i) * DAY) * 1000, price: 1 })),
};

const tx = (daysAgo: number, delta: number): WalletTx => ({
  timestamp: NOW - daysAgo * DAY,
  legs: { [USDC]: delta },
});

describe("portfolioSeries — how far back it is allowed to speak", () => {
  it("does not invent a balance for days before the first transaction it saw", () => {
    // The reported shape: a two-month-old account that deposited a little and
    // withdrew a lot, asked for a year. Undoing the withdrawals walks the balance UP
    // as it goes back, so it never trips the negative-balance guard.
    const series = portfolioSeries({
      now: NOW,
      days: 365,
      balancesNow: { [USDC]: 3553.36 },
      txs: [tx(60, 197.02), tx(45, -1200), tx(20, -1239.2), tx(10, 4795.54)],
      prices: FLAT_PRICES,
      // Paging reached the end of this wallet's history, so its first transaction is
      // sixty days old and there was nothing before it.
      bornAt: NOW - 60 * DAY,
    });

    expect(series.length).toBeGreaterThan(0);
    const earliest = series[0]!;

    // The account is 60 days old. Nothing older than that may be reported at all.
    expect((NOW - earliest.t) / DAY).toBeLessThanOrEqual(61);

    // And no day anywhere in the series may claim more than the wallet has ever held.
    const peak = Math.max(...series.map((d) => d.usd));
    expect(peak).toBeLessThan(5000);
  });

  it("still reports the whole window for a wallet that just held through it", () => {
    // Nothing to undo, so carrying today's holdings back is not a guess — the
    // quantities really were constant. Bounding this case would erase a year of
    // correct, quiet history.
    const series = portfolioSeries({
      now: NOW,
      days: 365,
      balancesNow: { [USDC]: 1000 },
      txs: [],
      prices: FLAT_PRICES,
    });

    expect(series.length).toBe(365);
    expect(series[0]!.usd).toBeCloseTo(1000, 2);
  });

  it("keeps history older than the window when the wallet has been around longer", () => {
    // The bound is the first transaction SEEN. One from before the window starts must
    // not clip anything inside it.
    const series = portfolioSeries({
      now: NOW,
      days: 90,
      balancesNow: { [USDC]: 500 },
      txs: [tx(300, 500)],
      prices: FLAT_PRICES,
      bornAt: NOW - 300 * DAY,
    });

    expect(series.length).toBe(90);
  });

  it("still refuses days where a holding goes negative", () => {
    // The original guard, unchanged: receiving 100 with no record of where it came
    // from means everything before that receipt is unknown, not −100.
    const series = portfolioSeries({
      now: NOW,
      days: 30,
      balancesNow: { [USDC]: 40 },
      txs: [tx(5, 100)],
      prices: FLAT_PRICES,
    });

    for (const d of series) expect(d.usd).toBeGreaterThanOrEqual(0);
    expect((NOW - series[0]!.t) / DAY).toBeLessThanOrEqual(6);
  });
});
