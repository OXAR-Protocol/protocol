"use client";

import { useMemo } from "react";

import { XSTOCKS } from "@/lib/yield/xstocks";
import { GOLD } from "@/lib/yield/gold";
import { useStockPrices } from "./use-stock-prices";

export interface Mover {
  id: string; // provider id, e.g. "xstock-nvda" — routes to /asset/{id}
  name: string; // display name, e.g. "NVIDIA"
  token: string; // on-chain symbol, e.g. "NVDAx"
  symbol: string; // ticker, e.g. "NVDA"
  mint: string;
  price: number;
  change24h: number; // percent
}

// Price-exposure catalog (stocks + gold) — the only assets with a market price that
// moves. Yield sources earn a steady APY, not a price move, so they aren't "movers".
const CATALOG = [
  ...XSTOCKS.map((s) => ({ id: s.id, name: s.name, token: s.token, symbol: s.symbol, mint: s.mint })),
  ...GOLD.map((g) => ({ id: g.id, name: g.name, token: g.token, symbol: g.symbol, mint: g.mint })),
];

const ALL_MINTS = CATALOG.map((c) => c.mint);

/**
 * Top movers by 24h price change across the tradable catalog (stocks + gold).
 * One Jupiter Price v3 call (cached 60s) covers every mint. Ranked biggest gain first;
 * `limit` trims the strip. Assets without a live price are dropped.
 */
export function useTopMovers(limit = 10): { movers: Mover[]; loading: boolean } {
  const { prices, loading } = useStockPrices(ALL_MINTS);

  const movers = useMemo(() => {
    return CATALOG.map((c) => {
      const p = prices[c.mint];
      return p ? { ...c, price: p.price, change24h: p.change24h } : null;
    })
      .filter((m): m is Mover => m !== null)
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, limit);
  }, [prices, limit]);

  return { movers, loading };
}
