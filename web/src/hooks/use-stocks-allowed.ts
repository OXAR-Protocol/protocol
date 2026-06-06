"use client";

import { useEffect, useState } from "react";

import { getCached, setCache } from "@/lib/cache";

/**
 * Whether the tokenized-stocks section may be shown to this user (Reg S geoblock,
 * resolved server-side via /api/geo). Fail-closed: hidden until confirmed allowed,
 * so blocked / unknown-on-error users never see the securities offering.
 */
export function useStocksAllowed(): boolean {
  const [allowed, setAllowed] = useState<boolean>(() => getCached<boolean>("stocks-allowed") ?? false);

  useEffect(() => {
    const cached = getCached<boolean>("stocks-allowed");
    if (cached !== null) {
      setAllowed(cached);
      return;
    }
    let cancelled = false;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((j) => {
        const ok = j?.stocksBlocked === false;
        if (!cancelled) {
          setAllowed(ok);
          setCache("stocks-allowed", ok);
        }
      })
      .catch(() => {
        /* fail-closed: stay hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return allowed;
}
