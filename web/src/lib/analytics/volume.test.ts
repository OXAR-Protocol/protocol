import { describe, it, expect } from "vitest";

import { txFlow, walletFlows, totalVolume, newestTs, flowOrigin, isOurs, type DatedTx } from "@oxar/sdk";

const OWNER = "AkC8BHHNJQ61fXVsHVnWsferBm4PC6t8oT8YwRmrwDtB";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const META = "Xsa62P8g4tTFjTiWWpjKuU4qnZ7YCS4RRhSHXeqiXTs";
const USDG = "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH";

/** The stable basket, as `CASH_MINTS` hands it over. */
const STABLES: ReadonlySet<string> = new Set([USDC, USDG]);

/** A transaction expressed the way Helius reports it: net change per token account. */
function tx(sig: string, ts: number, legs: Record<string, number>): DatedTx {
  return {
    signature: sig,
    timestamp: ts,
    accountData: Object.entries(legs).map(([mint, amount]) => ({
      account: `ata-${mint}`,
      tokenBalanceChanges: [
        {
          userAccount: OWNER,
          mint,
          rawTokenAmount: { tokenAmount: String(Math.round(amount * 1e6)), decimals: 6 },
        },
      ],
    })),
  };
}

describe("txFlow", () => {
  it("reads a buy as stable coin spent", () => {
    const flow = txFlow(tx("sig1", 1_000, { [USDC]: -11.452405, [META]: 0.0176 }), OWNER, STABLES);
    expect(flow).toEqual({ sig: "sig1", ts: 1_000, spentUsd: 11.452405, receivedUsd: 0, origin: "unknown" });
  });

  it("reads a sell as stable coin received", () => {
    const flow = txFlow(tx("sig2", 2_000, { [USDC]: 20, [META]: -0.03 }), OWNER, STABLES);
    expect(flow).toEqual({ sig: "sig2", ts: 2_000, spentUsd: 0, receivedUsd: 20, origin: "unknown" });
  });

  it("states the settled amount, not the amount that was asked for", () => {
    // The row this whole table exists because of: typed $11.45, recorded $7,997.15
    // (the typed figure times the share price). The chain knows only the first.
    const flow = txFlow(tx("sig3", 3_000, { [USDC]: -11.452405, [META]: 0.0176 }), OWNER, STABLES);
    expect(flow?.spentUsd).toBeCloseTo(11.452405, 6);
    expect(flow?.spentUsd).toBeLessThan(100);
  });

  it("ignores a plain stable-coin transfer — no position on the other side", () => {
    expect(txFlow(tx("sig4", 4_000, { [USDC]: -50 }), OWNER, STABLES)).toBeNull();
  });

  it("ignores stable coin arriving from an on-ramp", () => {
    expect(txFlow(tx("sig5", 5_000, { [USDC]: 100 }), OWNER, STABLES)).toBeNull();
  });

  it("ignores an airdrop of some other token", () => {
    expect(txFlow(tx("sig6", 6_000, { [META]: 5 }), OWNER, STABLES)).toBeNull();
  });

  it("ignores dust", () => {
    expect(txFlow(tx("sig7", 7_000, { [USDC]: -0.000004, [META]: 0.0000001 }), OWNER, STABLES)).toBeNull();
  });

  it("ignores a transaction with no signature or no block time", () => {
    expect(txFlow({ ...tx("", 8_000, { [USDC]: -5, [META]: 1 }), signature: "" }, OWNER, STABLES)).toBeNull();
    expect(txFlow({ ...tx("sig8", 0, { [USDC]: -5, [META]: 1 }), timestamp: 0 }, OWNER, STABLES)).toBeNull();
  });

  it("counts the net of a multi-hop route once, not once per hop", () => {
    // A route that touches the owner's USDC account twice: -5 out, +0.06 back as
    // change. Summing legs would say $5.06 crossed; the net is what happened.
    const routed: DatedTx = {
      signature: "sig9",
      timestamp: 9_000,
      accountData: [
        {
          account: "ata-usdc",
          tokenBalanceChanges: [
            { userAccount: OWNER, mint: USDC, rawTokenAmount: { tokenAmount: "-5000000", decimals: 6 } },
          ],
        },
        {
          account: "ata-usdc",
          tokenBalanceChanges: [
            { userAccount: OWNER, mint: USDC, rawTokenAmount: { tokenAmount: "60000", decimals: 6 } },
          ],
        },
        {
          account: "ata-meta",
          tokenBalanceChanges: [
            { userAccount: OWNER, mint: META, rawTokenAmount: { tokenAmount: "7000", decimals: 6 } },
          ],
        },
      ],
    };
    expect(txFlow(routed, OWNER, STABLES)?.spentUsd).toBeCloseTo(4.94, 6);
  });

  it("ignores a stable-for-stable swap — the wallet changed dollars, it didn't trade", () => {
    // Real transaction 5oauRpAJYDii…: 2480 USDG out, 2459.13 USDC in. Read one mint
    // at a time this was the largest movement in our whole history, at $2,459. It is
    // a wallet swapping one dollar token for another, and netted across the basket
    // it is a $21 spread with nothing on the other side of it.
    expect(txFlow(tx("sig11", 11_000, { [USDG]: -2480, [USDC]: 2459.133147 }), OWNER, STABLES)).toBeNull();
  });

  it("still reads a buy paid for in a NON-USDC stable", () => {
    const flow = txFlow(tx("sig12", 12_000, { [USDG]: -25, [META]: 0.04 }), OWNER, STABLES);
    expect(flow?.spentUsd).toBeCloseTo(25, 6);
  });

  it("ignores someone else's movement in the same transaction", () => {
    const shared: DatedTx = {
      signature: "sig10",
      timestamp: 10_000,
      accountData: [
        {
          account: "ata-other",
          tokenBalanceChanges: [
            { userAccount: "SomeoneElse", mint: USDC, rawTokenAmount: { tokenAmount: "-900000000", decimals: 6 } },
          ],
        },
      ],
    };
    expect(txFlow(shared, OWNER, STABLES)).toBeNull();
  });
});

describe("walletFlows", () => {
  const txs = [
    tx("b", 2_000, { [USDC]: 20, [META]: -0.03 }),
    tx("a", 1_000, { [USDC]: -11.45, [META]: 0.0176 }),
    tx("skip", 1_500, { [USDC]: 100 }),
  ];

  it("keeps only the transactions that moved money, oldest first", () => {
    expect(walletFlows(txs, OWNER, STABLES).map((f) => f.sig)).toEqual(["a", "b"]);
  });

  it("totals both directions", () => {
    const totals = totalVolume(walletFlows(txs, OWNER, STABLES));
    expect(totals.spentUsd).toBeCloseTo(11.45, 6);
    expect(totals.receivedUsd).toBeCloseTo(20, 6);
    expect(totals.volumeUsd).toBeCloseTo(31.45, 6);
    expect(totals.netUsd).toBeCloseTo(-8.55, 6);
    expect(totals.transactions).toBe(2);
  });

  it("totals an empty history to zero rather than NaN", () => {
    expect(totalVolume([])).toEqual({
      spentUsd: 0,
      receivedUsd: 0,
      volumeUsd: 0,
      netUsd: 0,
      transactions: 0,
    });
  });
});

describe("newestTs", () => {
  it("is the latest block time held", () => {
    expect(newestTs(walletFlows([tx("a", 1_000, { [USDC]: -5, [META]: 1 }), tx("b", 9_000, { [USDC]: -5, [META]: 1 })], OWNER, STABLES))).toBe(9_000);
  });

  it("is 0 for an empty set — read the wallet from the beginning", () => {
    expect(newestTs([])).toBe(0);
  });
});

describe("attribution", () => {
  const RELAYER = "MQwRCwbeRmhpNdAjvkMysLHS92WSXQvw7wJ8hPoYFrL";
  const buy = (sig: string, feePayer?: string): DatedTx => ({
    ...tx(sig, 1_000, { [USDC]: -10, [META]: 0.015 }),
    feePayer,
  });

  it("takes our relayer paying the fee as proof the transaction is ours", () => {
    const flow = txFlow(buy("s1", RELAYER), OWNER, STABLES, { relayers: new Set([RELAYER]) });
    expect(flow?.origin).toBe("relayer");
    expect(isOurs(flow!)).toBe(true);
  });

  it("falls back to our own record of the signature", () => {
    const flow = txFlow(buy("s2"), OWNER, STABLES, { recorded: new Set(["s2"]) });
    expect(flow?.origin).toBe("recorded");
    expect(isOurs(flow!)).toBe(true);
  });

  it("prefers proof over our own record when both are present", () => {
    const flow = txFlow(buy("s3", RELAYER), OWNER, STABLES, {
      relayers: new Set([RELAYER]),
      recorded: new Set(["s3"]),
    });
    expect(flow?.origin).toBe("relayer");
  });

  it("leaves someone else's app unattributed — it is not our volume", () => {
    const flow = txFlow(buy("s4", OWNER), OWNER, STABLES, { relayers: new Set([RELAYER]) });
    expect(flow?.origin).toBe("unknown");
    expect(isOurs(flow!)).toBe(false);
  });

  it("is unknown when nothing to match against was given", () => {
    expect(flowOrigin(buy("s5", RELAYER))).toBe("unknown");
  });

  it("totals only our own flows when the caller filters first", () => {
    const txs = [buy("mine", RELAYER), buy("theirs", OWNER)];
    const flows = walletFlows(txs, OWNER, STABLES, { relayers: new Set([RELAYER]) });
    expect(flows).toHaveLength(2);
    expect(totalVolume(flows.filter(isOurs)).volumeUsd).toBeCloseTo(10, 6);
    expect(totalVolume(flows).volumeUsd).toBeCloseTo(20, 6);
  });
});
