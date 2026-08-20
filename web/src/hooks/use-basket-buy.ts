"use client";

import { useCallback, useState } from "react";

import { rescaleAllocations } from "@oxar/sdk";

import { usePaySource } from "@/hooks/use-pay-source";
import { useTopUp } from "@/hooks/use-top-up";
import { toFriendlyError } from "@/lib/yield";
import type { BulkTradeOutcome } from "@/hooks/use-bulk-trade";

/**
 * Paying for a basket, with whatever the money is currently shaped like.
 *
 * Dollars by default — that is what a purchase settles in, and what most wallets
 * hold. Two ways past that, and they are different questions:
 *
 * - The budget falls a little short of what was allocated. Nobody asked to trade;
 *   they asked to buy. The gap is covered from the biggest other holding, quoted
 *   first (see `useTopUp`), and the purchase goes ahead.
 * - The user PICKED another payment method — a coin, or something they already own.
 *   Then that method funds the whole purchase and the dollars sitting in the wallet
 *   are left alone, because choosing to pay with Apple and finding your dollars
 *   spent instead is not what was agreed.
 *
 * Either way the allocations are re-fitted to the dollars that ACTUALLY arrived
 * rather than the ones that were quoted — a swap lands at or under its quote, and
 * the shortfall would otherwise fall entirely on the last purchase in the run.
 */
export function useBasketBuy(run: (jobs: { kind: "buy"; id: string; amountUsd: number }[]) => Promise<BulkTradeOutcome[]>) {
  const pay = usePaySource();
  const { spareUsd, topUp, converting } = useTopUp(pay.assets);
  const [error, setError] = useState<string | null>(null);

  const cashUsd = pay.dollars.usd;

  const buy = useCallback(
    async (amounts: Record<string, number>): Promise<BulkTradeOutcome[]> => {
      setError(null);
      const wanted = Object.values(amounts).reduce((sum, v) => sum + v, 0);
      let spendable = cashUsd;

      try {
        if (pay.source) {
          spendable = await pay.raise(wanted);
        } else if (wanted > cashUsd + 0.05) {
          // A gap of a few cents isn't worth a swap — the allocations are trimmed to
          // the dollars already there instead.
          spendable = cashUsd + (await topUp(wanted - cashUsd));
          pay.refresh();
        }
      } catch (e) {
        console.error("Raising the money failed:", e);
        setError(toFriendlyError(e));
        return [];
      }

      const final = rescaleAllocations(amounts, spendable);
      const jobs = Object.entries(final).map(([id, amountUsd]) => ({ kind: "buy" as const, id, amountUsd }));
      if (jobs.length === 0) return [];
      return run(jobs);
    },
    [cashUsd, pay, topUp, run],
  );

  return {
    /** The chosen payment method and everything the picker needs to show it. */
    pay,
    /** Dollars, ready to spend now. */
    cashUsd,
    /** Everything else the wallet holds — only offered as an automatic top-up while
     *  the payment method IS dollars. */
    spareUsd,
    budgetUsd: pay.source ? pay.budgetUsd : cashUsd + spareUsd,
    converting: converting || pay.busy,
    error,
    setError,
    refreshAssets: pay.refresh,
    buy,
  };
}
