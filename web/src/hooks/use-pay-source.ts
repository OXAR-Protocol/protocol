"use client";

import { useCallback, useState } from "react";

import { pollArrival } from "@oxar/sdk";

import { useCashable, type Cashable } from "@/hooks/use-cashable";
import { useBulkFunding } from "@/hooks/use-bulk-funding";
import { useBulkTrade } from "@/hooks/use-bulk-trade";
import { useSolanaContext } from "@/providers/solana-provider";
import { excludePaySources, type PayExclusion } from "@/lib/pay/exclude";
import { readUsdcUsd } from "@/lib/usdc-balance";
import { UserFacingError } from "@/lib/yield";

/** How long to wait for a sale's dollars to show up before spending what's there. */
const ARRIVAL_MS = 40_000;

/** Below this, "pay with dollars" isn't an offer, it's a dead end. */
const MIN_FOR_DOLLARS = 1;

/**
 * What the purchase is paid with.
 *
 * Dollars by default, because that's what a purchase settles in and what most
 * wallets hold. But "you can only pay with dollars" is our plumbing showing again:
 * someone holding Apple and no USDC has the money, it is just in a different shape.
 * So the payment method is a choice — any coin, or anything already bought — and the
 * app does the shape-changing on the way through, priced and named before it runs.
 *
 * `null` means dollars. A coin reaches dollars by a swap, a position by a sale; that
 * difference is ours to handle, not something to make anyone learn.
 *
 * `exclude` says what this purchase IS, so the thing being bought can't pay for
 * itself — see `excludePaySources`.
 */
export function usePaySource(exclude?: PayExclusion) {
  const { items: cashable, dollars, assets, loading, refresh } = useCashable();
  const { fundUsdc, converting } = useBulkFunding();
  const bulk = useBulkTrade();
  const { connection, walletAddress } = useSolanaContext();
  const [source, setSource] = useState<Cashable | null>(null);
  const [chosen, setChosen] = useState(false);

  // Not memoised on purpose: `exclude` is written inline at every call site, so any
  // memo key would have to be rebuilt from its contents each render anyway — and the
  // entries this returns are the same objects `useCashable` already memoised.
  const items = excludePaySources(cashable, exclude);

  // Dollars are the default — but only when there are any. A wallet holding one
  // stock and no USDC would otherwise open on "$0.00 to spend" and a disabled
  // button, with the way out hidden inside a dropdown nobody has reason to open.
  // Never while the balances are still arriving: an unread balance is not a zero one,
  // and picking a holding to sell off the back of one would be the same mistake.
  const fallback = !chosen && !loading && dollars.usd < MIN_FOR_DOLLARS ? items[0] ?? null : null;
  // A method picked before the exclusion applied — the sheet stays mounted while the
  // purchase changes underneath it — falls back to dollars rather than paying for
  // something with itself.
  const picked = source && items.some((i) => i.key === source.key) ? source : null;
  const active = picked ?? fallback;

  const choose = (next: Cashable | null) => {
    setChosen(true);
    setSource(next);
  };

  /** Dollars this payment method can produce right now. */
  const budgetUsd = active ? active.usd : dollars.usd;

  /**
   * Turn `usd` of the chosen method into dollars in the wallet. Returns what
   * ACTUALLY landed — at or under what was asked for, and the caller must spend
   * that rather than the request, or the last purchase comes up short.
   */
  const raise = useCallback(
    async (usd: number): Promise<number> => {
      if (!active || usd <= 0) return dollars.usd;

      if (active.kind === "coin") {
        const landed = await fundUsdc(active.asset, usd);
        refresh();
        return landed;
      }

      // A sale doesn't report what it fetched — the swap happens inside the
      // provider's own transaction — so the dollars are watched for instead of
      // estimated. Ninety percent of the ask is enough to call it arrived: the
      // rest is slippage, and waiting for a number that will never come is worse.
      if (!walletAddress) throw new UserFacingError("Wallet not connected");
      const before = await readUsdcUsd(connection, walletAddress);
      const [outcome] = await bulk.run([
        {
          kind: "sell",
          id: active.view.id,
          shares: active.view.shares,
          valueUsd: active.usd,
          amountUsd: usd,
        },
      ]);
      if (!outcome?.ok) {
        throw new UserFacingError(outcome?.error ?? "That sale didn't go through, so nothing was bought.");
      }
      const landed = await pollArrival(
        () => readUsdcUsd(connection, walletAddress),
        before,
        usd * 0.9,
        () => false,
        ARRIVAL_MS,
        2000,
      );
      refresh();
      return landed;
    },
    [active, dollars.usd, fundUsdc, refresh, bulk, connection, walletAddress],
  );

  return {
    /** null = dollars. */
    source: active,
    setSource: choose,
    options: items,
    dollars,
    assets,
    refresh,
    budgetUsd,
    loading,
    busy: converting || bulk.state === "running",
    raise,
  };
}
