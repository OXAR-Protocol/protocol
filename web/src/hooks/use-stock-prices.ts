"use client";

import { useEffect, useState } from "react";

import { getCached, setCache } from "@/lib/cache";

export interface StockPrice {
  /** USD price per share. */
  price: number;
  /** 24h change, percent (e.g. -1.19). */
  change24h: number;
}

/** Live prices + 24h change for a set of mints (Jupiter Price v3), cached 60s. */
export function useStockPrices(mints: string[]) {
  const key = mints.slice().sort().join(",");
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      return;
    }
    const cacheKey = `stock-prices:${key}`;
    const cached = getCached<Record<string, StockPrice>>(cacheKey);
    if (cached) {
      setPrices(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${key}`);
        const json = (await res.json()) as Record<
          string,
          { usdPrice?: number; priceChange24h?: number } | undefined
        >;
        const out: Record<string, StockPrice> = {};
        for (const mint of key.split(",")) {
          const p = json[mint];
          if (p && typeof p.usdPrice === "number") {
            out[mint] = {
              price: p.usdPrice,
              change24h: typeof p.priceChange24h === "number" ? p.priceChange24h : 0,
            };
          }
        }
        if (!cancelled) {
          setPrices(out);
          setCache(cacheKey, out);
        }
      } catch {
        if (!cancelled) setPrices({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { prices, loading };
}
