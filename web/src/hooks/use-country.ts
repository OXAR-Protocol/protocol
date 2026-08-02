"use client";

import { useEffect, useState } from "react";

import { getCached, setCache } from "@/lib/cache";

/**
 * The request's country (Vercel's IP header, via /api/geo), or null when it isn't
 * known — local dev, or the call failed. Used to tell someone up front that a card
 * provider doesn't serve them; unknown means we simply say nothing.
 */
export function useCountry(): string | null {
  const [country, setCountry] = useState<string | null>(() => getCached<string>("geo-country"));

  useEffect(() => {
    if (getCached<string>("geo-country")) return;
    let cancelled = false;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((j) => {
        const code = typeof j?.country === "string" ? j.country : null;
        if (!cancelled && code) {
          setCountry(code);
          setCache("geo-country", code);
        }
      })
      .catch(() => {
        /* unknown country → the chooser just doesn't add a coverage note */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return country;
}
