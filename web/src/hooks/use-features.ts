"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { useSolanaContext } from "@/providers/solana-provider";
import { getCached, setCache } from "@/lib/cache";

/**
 * Feature keys this signed-in user may see (`/api/access/features`).
 *
 * FAILS CLOSED: an empty list until the server answers, so work in progress is
 * never flashed at a real user because a request was slow. Identity is the sign-in
 * email plus the wallet address — login can be either, since the alpha wall sits
 * outside Privy.
 */
export function useFeatures(): readonly string[] {
  const { user } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const email = user?.email?.address ?? null;
  const wallet = walletAddress?.toBase58() ?? null;
  const key = `features:${email ?? ""}:${wallet ?? ""}`;

  const [features, setFeatures] = useState<readonly string[]>(
    () => getCached<string[]>(key) ?? [],
  );

  useEffect(() => {
    const cached = getCached<string[]>(key);
    if (cached) {
      setFeatures(cached);
      return;
    }
    let cancelled = false;
    fetch("/api/access/features", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, wallet }),
    })
      .then((r) => r.json())
      .then((j: { features?: string[] }) => {
        const list = Array.isArray(j?.features) ? j.features : [];
        if (!cancelled) {
          setFeatures(list);
          setCache(key, list);
        }
      })
      .catch(() => {
        /* fail-closed: stay dark */
      });
    return () => {
      cancelled = true;
    };
  }, [email, wallet, key]);

  return features;
}

/** Whether one feature is on for this user. Dark until the server says otherwise. */
export function useFeature(key: string): boolean {
  return useFeatures().includes(key);
}
