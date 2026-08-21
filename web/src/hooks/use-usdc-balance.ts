"use client";

import { useCallback, useEffect, useState } from "react";

import { clearCache, once } from "@/lib/cache";
import { readUsdcUsd } from "@/lib/usdc-balance";
import { useSolanaContext } from "@/providers/solana-provider";

/**
 * The dollars in the wallet. One reader, for every screen that asks.
 *
 * There used to be two answers to that question. The money sheet read the balance
 * straight off the chain; the home card and the buying screen derived it from the
 * indexer's asset list valued through a price API — and that path can lose USDC (an
 * unpriced mint reads as $0 and gets dropped as dust), so the same label said "$76.85"
 * in one place and "$0.00 free to use" in another, with the buy screen offering no
 * dollars to pay with at all.
 *
 * A dollar figure has no business depending on a price feed. This reads the token
 * balance and nothing else: it is right whenever the RPC answers, and when it doesn't
 * it says so (`usd === null`) rather than reporting zero.
 */
export function useUsdcBalance() {
  const { connection, walletAddress } = useSolanaContext();
  const [usd, setUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (fresh = false) => {
      if (!walletAddress) {
        setUsd(0);
        setLoading(false);
        return;
      }
      const key = `usdc-balance:${walletAddress.toBase58()}`;
      if (fresh) clearCache(key);
      try {
        setUsd(await once(key, () => readUsdcUsd(connection, walletAddress)));
      } catch {
        // Keep the last known figure. Money that failed to load is not money spent.
      } finally {
        setLoading(false);
      }
    },
    [connection, walletAddress],
  );

  useEffect(() => {
    void load();
  }, [load]);

  /** Re-read after something moved — a purchase, a sale, a top-up. */
  const refresh = useCallback(() => void load(true), [load]);

  /** `usd` is `null` until the first read lands — not zero, which is a claim. */
  return { usd, loading, refresh };
}
