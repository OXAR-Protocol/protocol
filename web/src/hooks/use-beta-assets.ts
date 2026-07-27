"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { useSolanaContext } from "@/providers/solana-provider";
import { getCached, setCache } from "@/lib/cache";

/**
 * Which `beta` yield sources this signed-in user may see (`/api/access/beta`).
 *
 * FAILS CLOSED: an empty list until the server says otherwise, so a pilot asset is
 * never shown to a tester because a request was slow or failed. Identity is the
 * sign-in email when there is one, plus the wallet address — login can be either.
 */
export function useBetaAssets(): readonly string[] {
  const { user } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const email = user?.email?.address ?? null;
  const wallet = walletAddress?.toBase58() ?? null;
  const key = `beta-assets:${email ?? ""}:${wallet ?? ""}`;

  const [assets, setAssets] = useState<readonly string[]>(
    () => getCached<string[]>(key) ?? [],
  );

  useEffect(() => {
    if (!email && !wallet) {
      setAssets([]);
      return;
    }
    const cached = getCached<string[]>(key);
    if (cached) {
      setAssets(cached);
      return;
    }
    let cancelled = false;
    fetch("/api/access/beta", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, wallet }),
    })
      .then((r) => r.json())
      .then((j: { assets?: string[] }) => {
        const list = Array.isArray(j?.assets) ? j.assets : [];
        if (!cancelled) {
          setAssets(list);
          setCache(key, list);
        }
      })
      .catch(() => {
        /* fail-closed: stay hidden */
      });
    return () => {
      cancelled = true;
    };
  }, [email, wallet, key]);

  return assets;
}
