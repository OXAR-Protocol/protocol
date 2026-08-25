import { describe, it, expect } from "vitest";

import { valueHoldings, totalAum } from "@oxar/sdk";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const JL_USDC = "9BEcn9aPEmhSPbPQeFGjidRiEKki46fVQDyPpSQXPA2D";
const GOLD = "2VhjJ9WxaGC3EZFwJG9BDUs9KxKCAjQY4vgd1qxgYWVg";

describe("valueHoldings", () => {
  it("prices what is held and totals it", () => {
    const v = valueHoldings({ [USDC]: 100, [GOLD]: 0.5 }, { [USDC]: 0.9999, [GOLD]: 3400 });
    expect(v.totalUsd).toBeCloseTo(99.99 + 1700, 2);
    expect(v.holdings[0].mint).toBe(GOLD); // biggest first
  });

  it("counts the yield, because the yield is in the price", () => {
    // A Jupiter Lend receipt accrues in its price, not in units: 100 units deposited
    // stay 100 units and become worth more. Valuing at $1 would report the deposit
    // and silently discard everything it earned.
    const v = valueHoldings({ [JL_USDC]: 100 }, { [JL_USDC]: 1.05716 });
    expect(v.totalUsd).toBeCloseTo(105.716, 3);
    expect(v.totalUsd).toBeGreaterThan(100);
  });

  it("names what it could not price instead of counting it as zero", () => {
    const v = valueHoldings({ [USDC]: 50, [GOLD]: 2 }, { [USDC]: 1 });
    expect(v.totalUsd).toBeCloseTo(50, 6);
    expect(v.unpriced).toEqual([GOLD]);
  });

  it("drops dust — a closed position's residue is not a holding", () => {
    const v = valueHoldings({ [USDC]: 0.000001 }, { [USDC]: 1 });
    expect(v.holdings).toEqual([]);
    expect(v.totalUsd).toBe(0);
  });

  it("ignores a zero or negative balance and a broken price", () => {
    const v = valueHoldings({ [USDC]: 0, [GOLD]: 1 }, { [GOLD]: 0 });
    expect(v.totalUsd).toBe(0);
    expect(v.unpriced).toEqual([GOLD]);
  });

  it("is zero, not NaN, for a wallet holding nothing", () => {
    expect(valueHoldings({}, {})).toEqual({ holdings: [], totalUsd: 0, unpriced: [] });
  });
});

describe("totalAum", () => {
  const a = valueHoldings({ [USDC]: 100 }, { [USDC]: 1 });
  const b = valueHoldings({ [USDC]: 50, [GOLD]: 1 }, { [USDC]: 1, [GOLD]: 3400 });
  const empty = valueHoldings({}, {});

  it("adds the wallets up and breaks the total down by market", () => {
    const t = totalAum([a, b, empty]);
    expect(t.totalUsd).toBeCloseTo(3550, 6);
    expect(t.byMint[USDC]).toBeCloseTo(150, 6);
    expect(t.byMint[GOLD]).toBeCloseTo(3400, 6);
  });

  it("counts only wallets that hold something", () => {
    expect(totalAum([a, b, empty]).wallets).toBe(2);
  });

  it("carries the unpriced mints up, deduped", () => {
    const gap = valueHoldings({ [GOLD]: 1 }, {});
    expect(totalAum([gap, gap]).unpriced).toEqual([GOLD]);
  });

  it("is zero for no wallets at all", () => {
    expect(totalAum([])).toEqual({ totalUsd: 0, wallets: 0, byMint: {}, unpriced: [] });
  });
});
