import { describe, it, expect } from "vitest";

import { walletDeltas } from "@oxar/sdk";

const OWNER = "AkC8ownerownerownerownerownerownerownerwdtb";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const GOLD = "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A";

/** Helper: one balance-change entry as Helius shapes it. */
const change = (mint: string, raw: string, decimals: number, user = OWNER) => ({
  userAccount: user,
  mint,
  rawTokenAmount: { tokenAmount: raw, decimals },
});

describe("walletDeltas", () => {
  it("reports the NET of a routed swap, not the sum of its hops", () => {
    // The shape that produced "+$2,459.13" on a five-dollar sale: a Jupiter route
    // whose legs each name the owner's token account, so adding them counts the
    // same dollars once per pool.
    const tx = {
      tokenTransfers: [
        { toUserAccount: OWNER, mint: USDC, tokenAmount: 2454.17 },
        { toUserAccount: OWNER, mint: USDC, tokenAmount: 4.96 },
        { fromUserAccount: OWNER, mint: USDC, tokenAmount: 2454.17 },
        { fromUserAccount: OWNER, mint: GOLD, tokenAmount: 0.00113 },
      ],
      accountData: [
        { account: "ata-usdc", tokenBalanceChanges: [change(USDC, "4960000", 6)] },
        { account: "ata-gold", tokenBalanceChanges: [change(GOLD, "-1130000", 9)] },
      ],
    };

    const deltas = walletDeltas(tx, OWNER);
    expect(deltas[USDC]).toBeCloseTo(4.96, 6);
    expect(deltas[GOLD]).toBeCloseTo(-0.00113, 9);
  });

  it("ignores balance changes belonging to somebody else", () => {
    const tx = {
      accountData: [
        {
          account: "pool-ata",
          tokenBalanceChanges: [
            change(USDC, "999000000", 6, "SomeoneElsePool1111111111111111111111111111"),
            change(USDC, "5000000", 6),
          ],
        },
      ],
    };

    expect(walletDeltas(tx, OWNER)[USDC]).toBeCloseTo(5, 6);
  });

  it("adds up several accounts of the same mint", () => {
    const tx = {
      accountData: [
        { account: "a", tokenBalanceChanges: [change(USDC, "1500000", 6)] },
        { account: "b", tokenBalanceChanges: [change(USDC, "-500000", 6)] },
      ],
    };

    expect(walletDeltas(tx, OWNER)[USDC]).toBeCloseTo(1, 6);
  });

  it("falls back to transfers when there is no balance-change data", () => {
    const tx = {
      tokenTransfers: [
        { toUserAccount: OWNER, mint: USDC, tokenAmount: 4.98 },
        { fromUserAccount: "someone", toUserAccount: "else", mint: USDC, tokenAmount: 100 },
      ],
    };

    expect(walletDeltas(tx, OWNER)[USDC]).toBeCloseTo(4.98, 6);
  });

  it("agrees with the old reading on a plain transfer", () => {
    const viaBalances = walletDeltas(
      {
        accountData: [{ account: "ata", tokenBalanceChanges: [change(USDC, "-5000000", 6)] }],
        tokenTransfers: [{ fromUserAccount: OWNER, mint: USDC, tokenAmount: 5 }],
      },
      OWNER,
    );
    const viaTransfers = walletDeltas(
      { tokenTransfers: [{ fromUserAccount: OWNER, mint: USDC, tokenAmount: 5 }] },
      OWNER,
    );

    expect(viaBalances[USDC]).toBeCloseTo(viaTransfers[USDC], 6);
  });

  it("says nothing moved when the transaction didn't touch the owner's tokens", () => {
    const tx = { accountData: [{ account: "x", tokenBalanceChanges: [] }] };
    expect(walletDeltas(tx, OWNER)).toEqual({});
  });
});
