import { describe, it, expect } from "vitest";

import { planWithdrawal } from "./withdraw";

const DECIMALS = 6;

describe("planWithdrawal", () => {
  it("redeems ALL shares when the requested amount is the full position", () => {
    // position = $1.00, shares = 980000 (share count differs from assets)
    const plan = planWithdrawal({
      requested: "1",
      positionBaseUnits: 1_000_000n,
      shares: 980_000n,
      decimals: DECIMALS,
    });
    expect(plan).toEqual({ mode: "redeemAll", shares: 980_000n });
  });

  // The bug we fixed: a $1 deposit reads back as 0.999999 (share→asset rounding),
  // the user types "1", and asset-denominated withdraw can never reach 100%.
  // Treat "asked for ≥ position" as a full exit → redeem all shares.
  it("redeems all shares when the asked amount rounds at/above a sub-unit position", () => {
    const plan = planWithdrawal({
      requested: "1",
      positionBaseUnits: 999_999n, // 0.999999 USDC
      shares: 999_000n,
      decimals: DECIMALS,
    });
    expect(plan).toEqual({ mode: "redeemAll", shares: 999_000n });
  });

  it("does a partial asset withdraw when below the full position", () => {
    const plan = planWithdrawal({
      requested: "0.5",
      positionBaseUnits: 1_000_000n,
      shares: 980_000n,
      decimals: DECIMALS,
    });
    expect(plan).toEqual({ mode: "withdraw", amount: 500_000n });
  });

  it("returns null for a zero / empty request", () => {
    expect(
      planWithdrawal({ requested: "0", positionBaseUnits: 1_000_000n, shares: 1n, decimals: DECIMALS }),
    ).toBeNull();
  });

  it("returns null when there is no position", () => {
    expect(
      planWithdrawal({ requested: "1", positionBaseUnits: 0n, shares: 0n, decimals: DECIMALS }),
    ).toBeNull();
  });
});
