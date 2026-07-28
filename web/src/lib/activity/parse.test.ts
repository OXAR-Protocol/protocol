import { describe, it, expect } from "vitest";

import { parseActivity } from "./parse";
import type { EnhancedTx } from "@/lib/helius/history";

const OWNER = "OwnerWa11et1111111111111111111111111111111";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const AAPL = "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp";
const GOLD = "AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P";
const VAULT = "jLVaU1tt0000000000000000000000000000000000"; // a lending receipt token

const NAMES = { [AAPL]: "Apple", [GOLD]: "Tether Gold" };

const tx = (sig: string, ts: number, transfers: EnhancedTx["tokenTransfers"]): EnhancedTx => ({
  signature: sig,
  timestamp: ts,
  tokenTransfers: transfers,
});

describe("parseActivity", () => {
  it("labels a USDC→asset swap as Bought, with the USDC spent", () => {
    const [e] = parseActivity(
      [tx("s1", 100, [
        { fromUserAccount: OWNER, mint: USDC, tokenAmount: 2 },
        { toUserAccount: OWNER, mint: AAPL, tokenAmount: 0.01 },
      ])],
      OWNER, USDC, NAMES,
    );
    expect(e).toMatchObject({ kind: "buy", label: "Bought Apple", usd: 2 });
  });

  it("labels an asset→USDC swap as Sold, with the USDC received", () => {
    const [e] = parseActivity(
      [tx("s2", 200, [
        { fromUserAccount: OWNER, mint: GOLD, tokenAmount: 0.0005 },
        { toUserAccount: OWNER, mint: USDC, tokenAmount: 1.99 },
      ])],
      OWNER, USDC, NAMES,
    );
    expect(e).toMatchObject({ kind: "sell", label: "Sold Tether Gold", usd: 1.99 });
  });

  it("labels a USDC-out + vault-receipt-in tx as Deposited", () => {
    const [e] = parseActivity(
      [tx("s3", 300, [
        { fromUserAccount: OWNER, mint: USDC, tokenAmount: 1 },
        { toUserAccount: OWNER, mint: VAULT, tokenAmount: 0.97 },
      ])],
      OWNER, USDC, NAMES,
    );
    expect(e).toMatchObject({ kind: "deposit", label: "Deposited", usd: 1 });
  });

  it("labels a bare USDC arrival (no other leg) as Received USDC", () => {
    const [e] = parseActivity(
      [tx("s4", 400, [{ toUserAccount: OWNER, mint: USDC, tokenAmount: 5 }])],
      OWNER, USDC, NAMES,
    );
    expect(e).toMatchObject({ kind: "receive", label: "Received USDC", usd: 5 });
  });

  it("drops transactions that touch neither USDC nor a known asset", () => {
    const events = parseActivity(
      [tx("s5", 500, [{ toUserAccount: OWNER, mint: "SomeRandomNftMint11111111111111111111111111", tokenAmount: 1 }])],
      OWNER, USDC, NAMES,
    );
    expect(events).toHaveLength(0);
  });

  it("preserves input (newest-first) order", () => {
    const events = parseActivity(
      [
        tx("new", 900, [{ fromUserAccount: OWNER, mint: USDC, tokenAmount: 1 }, { toUserAccount: OWNER, mint: AAPL, tokenAmount: 0.01 }]),
        tx("old", 100, [{ fromUserAccount: OWNER, mint: USDC, tokenAmount: 1 }, { toUserAccount: OWNER, mint: GOLD, tokenAmount: 0.001 }]),
      ],
      OWNER, USDC, NAMES,
    );
    expect(events.map((e) => e.signature)).toEqual(["new", "old"]);
  });
});

describe("what a trade actually was", () => {
  // "Bought $50" doesn't tell you what you own. The quantity and the price paid do,
  // and both are already in the transaction — no self-tracking needed.
  it("reports units and the price per unit on a buy", () => {
    const [e] = parseActivity(
      [tx("b1", 300, [
        { fromUserAccount: OWNER, mint: USDC, tokenAmount: 3 },
        { toUserAccount: OWNER, mint: AAPL, tokenAmount: 0.0076252 },
      ])],
      OWNER, USDC, NAMES,
    );
    expect(e.kind).toBe("buy");
    expect(e.mint).toBe(AAPL);
    expect(e.units).toBeCloseTo(0.0076252, 7);
    expect(e.unitPriceUsd).toBeCloseTo(393.4, 1);
  });

  it("reports units on a sell too, as a positive quantity", () => {
    const [e] = parseActivity(
      [tx("s3", 400, [
        { fromUserAccount: OWNER, mint: AAPL, tokenAmount: 0.0076252 },
        { toUserAccount: OWNER, mint: USDC, tokenAmount: 2.94 },
      ])],
      OWNER, USDC, NAMES,
    );
    expect(e.kind).toBe("sell");
    expect(e.units).toBeCloseTo(0.0076252, 7);
    expect(e.unitPriceUsd).toBeCloseTo(385.6, 1);
  });

  // A plain transfer in has no USDC leg to divide by — quantity yes, price no.
  it("leaves the unit price out when nothing was paid", () => {
    const [e] = parseActivity(
      [tx("r1", 500, [{ toUserAccount: OWNER, mint: AAPL, tokenAmount: 0.5 }])],
      OWNER, USDC, NAMES,
    );
    expect(e.kind).toBe("receive");
    expect(e.units).toBeCloseTo(0.5, 6);
    expect(e.unitPriceUsd).toBeUndefined();
  });

  it("leaves asset fields off a plain USDC movement", () => {
    const [e] = parseActivity(
      [tx("u1", 600, [{ toUserAccount: OWNER, mint: USDC, tokenAmount: 25 }])],
      OWNER, USDC, NAMES,
    );
    expect(e.mint).toBeUndefined();
    expect(e.units).toBeUndefined();
  });
});

// The per-unit price used to divide a CENT-ROUNDED amount by a tiny unit count, which
// turned half a cent into ~$80/oz on gold. A $0.25 buy and a $0.25 sell came out
// $158/oz apart on rounding alone — a spread the user never paid.
describe("per-unit price precision", () => {
  const tx = (usdc: number, gold: number) => ({
    signature: "sig",
    timestamp: 1_773_273_600,
    tokenTransfers: [
      {
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        tokenAmount: Math.abs(usdc),
        fromUserAccount: usdc < 0 ? "OWNER" : "POOL",
        toUserAccount: usdc < 0 ? "POOL" : "OWNER",
      },
      {
        mint: "GOLDMINT",
        tokenAmount: Math.abs(gold),
        fromUserAccount: gold < 0 ? "OWNER" : "POOL",
        toUserAccount: gold < 0 ? "POOL" : "OWNER",
      },
    ],
  });

  const NAMES = { GOLDMINT: "Tether Gold (XAUt0)" };
  const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  it("prices from the raw amount, not the displayed cents", () => {
    // 0.2599 paid for 0.000063 units → 4125.4/oz. Rounding usd to $0.26 first would
    // have reported 4126.98 — a difference of more than a dollar an ounce.
    const [e] = parseActivity([tx(-0.2599, 0.000063)], "OWNER", USDC, NAMES);
    expect(e!.usd).toBe(0.26); // still rounded for display
    expect(e!.unitPriceUsd).toBeCloseTo(0.2599 / 0.000063, 6);
  });

  it("a matched buy and sell at the same real price no longer look far apart", () => {
    const [buy] = parseActivity([tx(-0.26, 0.000063)], "OWNER", USDC, NAMES);
    const [sell] = parseActivity([tx(0.26, -0.000063)], "OWNER", USDC, NAMES);
    expect(buy!.unitPriceUsd).toBeCloseTo(sell!.unitPriceUsd!, 6);
  });
});
