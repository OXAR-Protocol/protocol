import { describe, it, expect } from "vitest";

import { costBasisFromSwaps, type HeliusTx } from "./swaps";

const OWNER = "OwnerWa11et1111111111111111111111111111111";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
/** Every dollar the app deals in. Which one a trade settled in is not a fact about
 *  what it cost — reading just one made a USDT-paid purchase look free. */
const DOLLARS = new Set([USDC, USDT]);
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

describe("costBasisFromSwaps", () => {
  it("counts the dollars spent buying the held asset", () => {
    expect(costBasisFromSwaps([buy(3.0, 2.64)], OWNER, USDY, DOLLARS).basis).toBeCloseTo(3.0, 9);
  });

  it("subtracts the dollars received when selling the held asset", () => {
    const txs = [buy(5.0, 4.4), sell(2.2, 2.5)];
    // invested 5.0 in, took 2.5 back out → 2.5 net
    expect(costBasisFromSwaps(txs, OWNER, USDY, DOLLARS).basis).toBeCloseTo(2.5, 9);
  });

  it("ignores transactions where the held asset didn't move for the owner", () => {
    const unrelated: HeliusTx = {
      tokenTransfers: [
        { mint: USDC, fromUserAccount: OWNER, toUserAccount: "someone", tokenAmount: 10 },
      ],
    };
    expect(costBasisFromSwaps([unrelated], OWNER, USDY, DOLLARS).basis).toBe(0);
  });

  it("ignores transfers that don't involve the owner", () => {
    const other: HeliusTx = {
      tokenTransfers: [
        { mint: USDY, fromUserAccount: "a", toUserAccount: "b", tokenAmount: 1 },
        { mint: USDC, fromUserAccount: "a", toUserAccount: "b", tokenAmount: 1 },
      ],
    };
    expect(costBasisFromSwaps([other], OWNER, USDY, DOLLARS).basis).toBe(0);
  });

  it("treats a free receipt of the held asset as zero cost (honest)", () => {
    const gift: HeliusTx = {
      tokenTransfers: [
        { mint: USDY, fromUserAccount: "donor", toUserAccount: OWNER, tokenAmount: 1 },
      ],
    };
    expect(costBasisFromSwaps([gift], OWNER, USDY, DOLLARS).basis).toBe(0);
  });

  it("nets multiple buys", () => {
    expect(costBasisFromSwaps([buy(1, 0.9), buy(2, 1.8)], OWNER, USDY, DOLLARS).basis).toBeCloseTo(3, 9);
  });

  // Jupiter Lend: you hold a jlToken receipt; deposit = cost→jlToken, withdraw = jlToken→cost.
  // Same engine, heldMint = the jlToken, costMint = the deposited dollar.
  it("attributes a Jupiter-Lend deposit + withdraw (held = jlToken)", () => {
    const JL_USDC = "9BEcn9aPEmhSPbPQeFGjidRiEKki46fVQDyPpSQXPA2D";
    const deposit = (usdc: number, jl: number): HeliusTx => ({
      tokenTransfers: [
        { mint: USDC, fromUserAccount: OWNER, toUserAccount: "jlprogram", tokenAmount: usdc },
        { mint: JL_USDC, fromUserAccount: "jlprogram", toUserAccount: OWNER, tokenAmount: jl },
      ],
    });
    const withdraw = (jl: number, usdc: number): HeliusTx => ({
      tokenTransfers: [
        { mint: JL_USDC, fromUserAccount: OWNER, toUserAccount: "jlprogram", tokenAmount: jl },
        { mint: USDC, fromUserAccount: "jlprogram", toUserAccount: OWNER, tokenAmount: usdc },
      ],
    });
    // deposit $5, withdraw $2 back → $3 net invested (earned = current value − 3).
    expect(costBasisFromSwaps([deposit(5, 4.75), withdraw(2, 2)], OWNER, JL_USDC, DOLLARS).basis).toBeCloseTo(3, 9);
  });

  // Regression: a wallet that sent part of its position to another address showed a
  // phantom loss, because the units left but the cost attributed to them stayed.
  const sendOut = (usdy: number): HeliusTx => ({
    tokenTransfers: [
      { mint: USDY, fromUserAccount: OWNER, toUserAccount: "someone-else", tokenAmount: usdy },
    ],
  });

  it("retires the basis of units transferred out with no proceeds", () => {
    // Bought 10 units for $10, then gave half away → $5 still invested in the rest.
    expect(costBasisFromSwaps([buy(10, 10), sendOut(5)], OWNER, USDY, DOLLARS).basis).toBeCloseTo(5, 9);
  });

  it("zeroes the basis when the whole position is sent away", () => {
    expect(costBasisFromSwaps([buy(10, 10), sendOut(10)], OWNER, USDY, DOLLARS).basis).toBeCloseTo(0, 9);
  });

  it("never drives the basis negative when more is sent than we saw acquired", () => {
    // History window can start mid-life, so a disposal may exceed the units we know of.
    expect(costBasisFromSwaps([buy(4, 4), sendOut(9)], OWNER, USDY, DOLLARS).basis).toBeCloseTo(0, 9);
    expect(costBasisFromSwaps([sendOut(3)], OWNER, USDY, DOLLARS).basis).toBe(0);
  });

  it("keeps a sale and a transfer-out distinct", () => {
    // Sale returns money (basis −proceeds); a transfer returns nothing (basis pro-rata).
    expect(costBasisFromSwaps([buy(10, 10), sell(5, 6)], OWNER, USDY, DOLLARS).basis).toBeCloseTo(4, 9);
    expect(costBasisFromSwaps([buy(10, 10), sendOut(5)], OWNER, USDY, DOLLARS).basis).toBeCloseTo(5, 9);
  });

  it("orders by timestamp, since Helius returns newest-first", () => {
    const newestFirst: HeliusTx[] = [
      { ...sendOut(5), timestamp: 200 },
      { ...buy(10, 10), timestamp: 100 },
    ];
    // Processed oldest-first the buy funds the units the send then retires → $5.
    expect(costBasisFromSwaps(newestFirst, OWNER, USDY, DOLLARS).basis).toBeCloseTo(5, 9);
  });

  // The market a position was bought on is not a fact about the position. Reading a
  // single settlement token, a jlUSDT deposit paid in USDT looked like a free gift —
  // nothing invested — so the whole balance read as profit.
  it("counts a deposit settled in USDT, which one chosen token would have missed", () => {
    const JL_USDT = "Cmn4v2wipYV41dkakDvCgFJpxhtaaKt11NyWV8pjSE8A";
    const depositUsdt: HeliusTx = {
      tokenTransfers: [
        { mint: USDT, fromUserAccount: OWNER, toUserAccount: "jlprogram", tokenAmount: 4 },
        { mint: JL_USDT, fromUserAccount: "jlprogram", toUserAccount: OWNER, tokenAmount: 3.8 },
      ],
    };
    expect(costBasisFromSwaps([depositUsdt], OWNER, JL_USDT, DOLLARS).basis).toBeCloseTo(4, 9);
    // The old behaviour, kept here as the thing that must not come back.
    expect(costBasisFromSwaps([depositUsdt], OWNER, JL_USDT, new Set([USDC])).basis).toBe(0);
  });

  // `covered` is what stops a zero basis being read as "you paid nothing for this".
  // Without it a holding the history can't explain reported its entire value as
  // profit: a $24 position said "+$24 since you bought".
  describe("covered", () => {
    const OTHER_ASSET = "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp";

    it("is true for a plain dollar purchase", () => {
      expect(costBasisFromSwaps([buy(3, 2.64)], OWNER, USDY, DOLLARS).covered).toBe(true);
    });

    it("is false when the held mint never moved — the buy is outside the window", () => {
      expect(costBasisFromSwaps([], OWNER, USDY, DOLLARS).covered).toBe(false);
    });

    it("is false for units received with no cost leg", () => {
      const gift: HeliusTx = {
        tokenTransfers: [
          { mint: USDY, fromUserAccount: "donor", toUserAccount: OWNER, tokenAmount: 1 },
        ],
      };
      const r = costBasisFromSwaps([gift], OWNER, USDY, DOLLARS);
      expect(r.basis).toBe(0);
      expect(r.covered).toBe(false);
    });

    // The real-world case: swapping one held asset straight into another. No dollar
    // leaves the wallet, so there is no cost to read — and the new position is not free.
    it("is false for an asset→asset swap", () => {
      const swap: HeliusTx = {
        tokenTransfers: [
          { mint: OTHER_ASSET, fromUserAccount: OWNER, toUserAccount: "pool", tokenAmount: 5 },
          { mint: USDY, fromUserAccount: "pool", toUserAccount: OWNER, tokenAmount: 4 },
        ],
      };
      const r = costBasisFromSwaps([swap], OWNER, USDY, DOLLARS);
      expect(r.basis).toBe(0);
      expect(r.covered).toBe(false);
    });

    it("is false when only part of the holding was paid for in dollars", () => {
      const gift: HeliusTx = {
        timestamp: 200,
        tokenTransfers: [
          { mint: USDY, fromUserAccount: "donor", toUserAccount: OWNER, tokenAmount: 10 },
        ],
      };
      const r = costBasisFromSwaps([{ ...buy(4, 4), timestamp: 100 }, gift], OWNER, USDY, DOLLARS);
      expect(r.basis).toBeCloseTo(4, 9);
      expect(r.covered).toBe(false);
    });

    // Once the unpriced units are gone the remainder is fully explained again.
    it("returns to true once the unpriced units have left", () => {
      const gift: HeliusTx = {
        timestamp: 100,
        tokenTransfers: [
          { mint: USDY, fromUserAccount: "donor", toUserAccount: OWNER, tokenAmount: 10 },
        ],
      };
      const out: HeliusTx = { ...sendOut(10), timestamp: 200 };
      expect(costBasisFromSwaps([gift, out], OWNER, USDY, DOLLARS).covered).toBe(true);
    });
  });
});
