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
