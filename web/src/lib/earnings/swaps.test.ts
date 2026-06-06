import { describe, it, expect } from "vitest";

import { netInvestedFromSwaps, type HeliusTx } from "./swaps";

const OWNER = "OwnerWa11et1111111111111111111111111111111";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDY = "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6";

const buy = (usdc: number, usdy: number): HeliusTx => ({
  tokenTransfers: [
    { mint: USDC, fromUserAccount: OWNER, toUserAccount: "pool", tokenAmount: usdc },
    { mint: USDY, fromUserAccount: "pool", toUserAccount: OWNER, tokenAmount: usdy },
  ],
});

const sell = (usdy: number, usdc: number): HeliusTx => ({
  tokenTransfers: [
    { mint: USDY, fromUserAccount: OWNER, toUserAccount: "pool", tokenAmount: usdy },
    { mint: USDC, fromUserAccount: "pool", toUserAccount: OWNER, tokenAmount: usdc },
  ],
});

describe("netInvestedFromSwaps", () => {
  it("counts USDC spent buying the held asset", () => {
    expect(netInvestedFromSwaps([buy(3.0, 2.64)], OWNER, USDY, USDC)).toBeCloseTo(3.0, 9);
  });

  it("subtracts USDC received when selling the held asset", () => {
    const txs = [buy(5.0, 4.4), sell(2.2, 2.5)];
    // invested 5.0 in, took 2.5 back out → 2.5 net
    expect(netInvestedFromSwaps(txs, OWNER, USDY, USDC)).toBeCloseTo(2.5, 9);
  });

  it("ignores transactions where the held asset didn't move for the owner", () => {
    const unrelated: HeliusTx = {
      tokenTransfers: [
        { mint: USDC, fromUserAccount: OWNER, toUserAccount: "someone", tokenAmount: 10 },
      ],
    };
    expect(netInvestedFromSwaps([unrelated], OWNER, USDY, USDC)).toBe(0);
  });

  it("ignores transfers that don't involve the owner", () => {
    const other: HeliusTx = {
      tokenTransfers: [
        { mint: USDY, fromUserAccount: "a", toUserAccount: "b", tokenAmount: 1 },
        { mint: USDC, fromUserAccount: "a", toUserAccount: "b", tokenAmount: 1 },
      ],
    };
    expect(netInvestedFromSwaps([other], OWNER, USDY, USDC)).toBe(0);
  });

  it("treats a free receipt of the held asset as zero cost (honest)", () => {
    const gift: HeliusTx = {
      tokenTransfers: [
        { mint: USDY, fromUserAccount: "donor", toUserAccount: OWNER, tokenAmount: 1 },
      ],
    };
    expect(netInvestedFromSwaps([gift], OWNER, USDY, USDC)).toBe(0);
  });

  it("nets multiple buys", () => {
    expect(netInvestedFromSwaps([buy(1, 0.9), buy(2, 1.8)], OWNER, USDY, USDC)).toBeCloseTo(3, 9);
  });
});
