import { describe, it, expect } from "vitest";

import { netInvestedFromSwaps, type HeliusTx } from "./swaps";

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

describe("netInvestedFromSwaps", () => {
  it("counts the dollars spent buying the held asset", () => {
    expect(netInvestedFromSwaps([buy(3.0, 2.64)], OWNER, USDY, DOLLARS)).toBeCloseTo(3.0, 9);
  });

  it("subtracts the dollars received when selling the held asset", () => {
    const txs = [buy(5.0, 4.4), sell(2.2, 2.5)];
    // invested 5.0 in, took 2.5 back out → 2.5 net
    expect(netInvestedFromSwaps(txs, OWNER, USDY, DOLLARS)).toBeCloseTo(2.5, 9);
  });

  it("ignores transactions where the held asset didn't move for the owner", () => {
    const unrelated: HeliusTx = {
      tokenTransfers: [
        { mint: USDC, fromUserAccount: OWNER, toUserAccount: "someone", tokenAmount: 10 },
      ],
    };
    expect(netInvestedFromSwaps([unrelated], OWNER, USDY, DOLLARS)).toBe(0);
  });

  it("ignores transfers that don't involve the owner", () => {
    const other: HeliusTx = {
      tokenTransfers: [
        { mint: USDY, fromUserAccount: "a", toUserAccount: "b", tokenAmount: 1 },
        { mint: USDC, fromUserAccount: "a", toUserAccount: "b", tokenAmount: 1 },
      ],
    };
    expect(netInvestedFromSwaps([other], OWNER, USDY, DOLLARS)).toBe(0);
  });

  it("treats a free receipt of the held asset as zero cost (honest)", () => {
    const gift: HeliusTx = {
      tokenTransfers: [
        { mint: USDY, fromUserAccount: "donor", toUserAccount: OWNER, tokenAmount: 1 },
      ],
    };
    expect(netInvestedFromSwaps([gift], OWNER, USDY, DOLLARS)).toBe(0);
  });

  it("nets multiple buys", () => {
    expect(netInvestedFromSwaps([buy(1, 0.9), buy(2, 1.8)], OWNER, USDY, DOLLARS)).toBeCloseTo(3, 9);
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
    expect(netInvestedFromSwaps([deposit(5, 4.75), withdraw(2, 2)], OWNER, JL_USDC, DOLLARS)).toBeCloseTo(3, 9);
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
    expect(netInvestedFromSwaps([buy(10, 10), sendOut(5)], OWNER, USDY, DOLLARS)).toBeCloseTo(5, 9);
  });

  it("zeroes the basis when the whole position is sent away", () => {
    expect(netInvestedFromSwaps([buy(10, 10), sendOut(10)], OWNER, USDY, DOLLARS)).toBeCloseTo(0, 9);
  });

  it("never drives the basis negative when more is sent than we saw acquired", () => {
    // History window can start mid-life, so a disposal may exceed the units we know of.
    expect(netInvestedFromSwaps([buy(4, 4), sendOut(9)], OWNER, USDY, DOLLARS)).toBeCloseTo(0, 9);
    expect(netInvestedFromSwaps([sendOut(3)], OWNER, USDY, DOLLARS)).toBe(0);
  });

  it("keeps a sale and a transfer-out distinct", () => {
    // Sale returns money (basis −proceeds); a transfer returns nothing (basis pro-rata).
    expect(netInvestedFromSwaps([buy(10, 10), sell(5, 6)], OWNER, USDY, DOLLARS)).toBeCloseTo(4, 9);
    expect(netInvestedFromSwaps([buy(10, 10), sendOut(5)], OWNER, USDY, DOLLARS)).toBeCloseTo(5, 9);
  });

  it("orders by timestamp, since Helius returns newest-first", () => {
    const newestFirst: HeliusTx[] = [
      { ...sendOut(5), timestamp: 200 },
      { ...buy(10, 10), timestamp: 100 },
    ];
    // Processed oldest-first the buy funds the units the send then retires → $5.
    expect(netInvestedFromSwaps(newestFirst, OWNER, USDY, DOLLARS)).toBeCloseTo(5, 9);
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
    expect(netInvestedFromSwaps([depositUsdt], OWNER, JL_USDT, DOLLARS)).toBeCloseTo(4, 9);
    // The old behaviour, kept here as the thing that must not come back.
    expect(netInvestedFromSwaps([depositUsdt], OWNER, JL_USDT, new Set([USDC]))).toBe(0);
  });
});
