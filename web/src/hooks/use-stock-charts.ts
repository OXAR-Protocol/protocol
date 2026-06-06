"use client";

import { useEffect, useState } from "react";

import { getCached, setCache } from "@/lib/cache";

/** Price-history closes per xStock mint (for card sparklines), via the batched
 *  `/api/stock-charts` proxy. One fetch for all tickers, cached. */
export function useStockCharts(): Record<string, number[]> {
  const [charts, setCharts] = useState<Record<string, number[]>>(
    () => getCached<Record<string, number[]>>("stock-charts") ?? {},
  );

  useEffect(() => {
    if (getCached<Record<string, number[]>>("stock-charts")) return;
    let cancelled = false;
    fetch("/api/stock-charts")
      .then((r) => r.json())
      .then((j) => {
        const c = (j?.charts ?? {}) as Record<string, number[]>;
        if (!cancelled) {
          setCharts(c);
          setCache("stock-charts", c);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return charts;
}
