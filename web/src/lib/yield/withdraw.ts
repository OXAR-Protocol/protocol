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
 * Asking for all but a sliver IS asking for all. The MAX button offers a readable
 * figure (a balance of 19.999785 prefills as 19.99), and without this that rounding
 * would turn a full exit into a partial one and strand the remainder — the very dust
 * the share-redeem path exists to avoid.
 */
const FULL_EXIT_DUST_CENTS = 1;

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

  // Asking for the whole position (or all but a cent) → full exit via shares.
  const dust = BigInt(FULL_EXIT_DUST_CENTS) * BigInt(10) ** BigInt(Math.max(decimals - 2, 0));
  if (amount >= positionBaseUnits - dust) return { mode: "redeemAll", shares };

  return { mode: "withdraw", amount };
}
