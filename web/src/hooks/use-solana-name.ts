"use client";

import { useEffect, useState } from "react";

// Session cache: a wallet's primary .sol name doesn't change within a visit, and we
// want to remember "no name" too so we don't refetch on every mount/navigation.
const nameCache = new Map<string, string | null>();

/**
 * Resolve an address's primary Solana Name Service (.sol) domain — best-effort, via the
 * Bonfida SNS proxy. Returns null when there's no name (or on any failure), so callers
 * fall back to the raw address. Never throws.
 */
export function useSolanaName(address: string | null | undefined): string | null {
  const [name, setName] = useState<string | null>(() =>
    address && nameCache.has(address) ? nameCache.get(address)! : null,
  );

  useEffect(() => {
    if (!address) {
      setName(null);
      return;
    }
    if (nameCache.has(address)) {
      setName(nameCache.get(address)!);
      return;
    }
    let cancelled = false;
    (async () => {
      let resolved: string | null = null;
      try {
        const res = await fetch(`https://sns-sdk-proxy.bonfida.workers.dev/favorite-domain/${address}`);
        if (res.ok) {
          const json = (await res.json()) as { s?: string; result?: { reverse?: string } };
          const reverse = json?.s === "ok" ? json.result?.reverse : undefined;
          if (reverse) resolved = `${reverse}.sol`;
        }
      } catch {
        /* best-effort — fall back to the address */
      }
      nameCache.set(address, resolved);
      if (!cancelled) setName(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return name;
}
