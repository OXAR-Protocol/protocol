"use client";

import { useEffect, useState } from "react";

import type { WalletAsset } from "@oxar/sdk";

// Resolve a fallback logo (CoinGecko) at most once per token, shared across all
// icon instances. `null` means "looked, found nothing" — render the monogram.
const fallbackCache = new Map<string, string | null>();
const keyOf = (a: WalletAsset) => `${a.chain}:${a.network ?? ""}:${a.mint}`;

async function resolveFallback(asset: WalletAsset): Promise<string | null> {
  const k = keyOf(asset);
  const cached = fallbackCache.get(k);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch("/api/token-icon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chain: asset.chain,
        network: asset.network,
        mint: asset.mint,
        symbol: asset.symbol,
      }),
    });
    const { icon } = (await res.json()) as { icon?: string | null };
    fallbackCache.set(k, icon ?? null);
    return icon ?? null;
  } catch {
    fallbackCache.set(k, null);
    return null;
  }
}

/**
 * Token logo with self-healing fallbacks: render the primary image (DAS /
 * Jupiter / Alchemy); if it's missing or its URL is dead, fetch a CoinGecko
 * logo; if that's gone too, show a symbol-initial monogram. `className` sizes it.
 */
export function TokenIcon({ asset, className }: { asset: WalletAsset; className: string }) {
  const [src, setSrc] = useState<string | null>(asset.logo ?? null);
  const [usedFallback, setUsedFallback] = useState(false);

  // No primary image → try CoinGecko straight away.
  useEffect(() => {
    let on = true;
    setSrc(asset.logo ?? null);
    setUsedFallback(false);
    if (!asset.logo) {
      resolveFallback(asset).then((url) => {
        if (on && url) {
          setSrc(url);
          setUsedFallback(true);
        }
      });
    }
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.mint, asset.logo]);

  // Primary URL failed to load → try CoinGecko once, else fall to the monogram.
  const onError = async () => {
    if (usedFallback) {
      setSrc(null);
      return;
    }
    setUsedFallback(true);
    const url = await resolveFallback(asset);
    setSrc(url && url !== src ? url : null);
  };

  if (!src)
    return (
      <span
        className={`${className} flex items-center justify-center rounded-full bg-black/[0.06] text-[10px] font-semibold uppercase text-black/50`}
      >
        {asset.symbol.slice(0, 1)}
      </span>
    );

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" onError={onError} className={`${className} rounded-full object-cover`} />
  );
}
