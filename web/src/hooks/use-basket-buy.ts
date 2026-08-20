"use client";

import { useCallback, useState } from "react";

import { rescaleAllocations } from "@oxar/sdk";

import { usePaySource } from "@/hooks/use-pay-source";
import { toFriendlyError } from "@/lib/yield";
import type { BulkTradeOutcome } from "@/hooks/use-bulk-trade";

/**
 * Paying for a basket, out of the payment method that was actually chosen.
 *
 * There used to be a second way in: if the dollars fell short, the app covered the
 * gap by quietly selling whatever else the wallet held. It was quoted before it ran,
 * but it was still a decision about YOUR other holdings that nobody asked for — the
 * mirror of the rule this file already keeps, that choosing to pay with one thing
 * must never spend another. Short is short. The payment method is one press away and
 * lists everything that could cover it, which is the honest version of the same help.
 *
 * The allocations are re-fitted to the dollars that ACTUALLY arrived rather than the
 * ones that were quoted — a swap lands at or under its quote, and the shortfall would
 * otherwise fall entirely on the last purchase in the run.
 */
export function useBasketBuy(run: (jobs: { kind: "buy"; id: string; amountUsd: number }[]) => Promise<BulkTradeOutcome[]>) {
  const pay = usePaySource();
  const [error, setError] = useState<string | null>(null);

  const cashUsd = pay.dollars.usd;

  const buy = useCallback(
    async (amounts: Record<string, number>): Promise<BulkTradeOutcome[]> => {
      setError(null);
      const wanted = Object.values(amounts).reduce((sum, v) => sum + v, 0);
      let spendable = cashUsd;

      if (pay.source) {
        try {
          spendable = await pay.raise(wanted);
        } catch (e) {
          console.error("Raising the money failed:", e);
          setError(toFriendlyError(e));
          return [];
        }
      }

      const final = rescaleAllocations(amounts, spendable);
      const jobs = Object.entries(final).map(([id, amountUsd]) => ({ kind: "buy" as const, id, amountUsd }));
      if (jobs.length === 0) return [];
      return run(jobs);
    },
    [cashUsd, pay, run],
  );

  return {
    /** The chosen payment method and everything the picker needs to show it. */
    pay,
    /** Dollars, ready to spend now. */
    cashUsd,
    budgetUsd: pay.source ? pay.budgetUsd : cashUsd,
    converting: pay.busy,
    error,
    setError,
    refreshAssets: pay.refresh,
    buy,
  };
}
