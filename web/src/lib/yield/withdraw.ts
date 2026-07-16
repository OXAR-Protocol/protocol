import { toBaseUnits } from "@oxar/sdk";

/**
 * What a withdraw should actually do. A full exit redeems ALL shares rather than
 * an asset-denominated withdraw: share→asset rounding means asset withdraws can
 * never reach 100% (a $1 deposit reads back as ~0.999999, leaving dust stranded).
 */
export type WithdrawPlan =
  | { mode: "redeemAll"; shares: bigint }
  | { mode: "withdraw"; amount: bigint };

/**
 * Decide how to withdraw `requested` (human amount) from a position. Returns null
 * when there's nothing to do. All comparisons are in base units (bigint) — no float.
 */
export function planWithdrawal(params: {
  requested: string | number;
  /** Current position (principal + yield) in base units. */
  positionBaseUnits: bigint;
  /** Provider share balance, burned in full on a complete exit. */
  shares: bigint;
  decimals: number;
}): WithdrawPlan | null {
  const { requested, positionBaseUnits, shares, decimals } = params;
  const ZERO = BigInt(0);
  if (positionBaseUnits <= ZERO) return null;

  const amount = toBaseUnits(requested, decimals);
  if (amount <= ZERO) return null;

  // Asking for the whole position (or more) → full exit via shares, no rounding wall.
  if (amount >= positionBaseUnits) return { mode: "redeemAll", shares };

  return { mode: "withdraw", amount };
}
