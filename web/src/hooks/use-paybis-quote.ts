"use client";

import { useEffect, useState } from "react";

import { readPaybisError, readPaybisQuote, type PaybisFiat, type PaybisQuote, type PaybisSide } from "@oxar/sdk";

/** Wait this long after the last keystroke before quoting — their rate is not free. */
const DEBOUNCE_MS = 450;

interface Settled {
  /** Which order this answer belongs to; "" before the first one. */
  key: string;
  quote: PaybisQuote | null;
  error: string | null;
}

/**
 * Live Paybis quote for an order — USDC out when selling, fiat in when buying.
 * Debounced on the amount so typing "1000" is one quote, not four.
 *
 * State is only ever written from async callbacks, and `loading` is derived by
 * comparing the answer we hold against the answer we want — so nothing is set
 * synchronously during render or effect setup.
 */
export function usePaybisQuote(side: PaybisSide, amount: number, fiat: PaybisFiat) {
  const key = Number.isFinite(amount) && amount > 0 ? `${side}:${amount}:${fiat}` : "";
  const [settled, setSettled] = useState<Settled>({ key: "", quote: null, error: null });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      fetch("/api/paybis-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ side, amount, fiat }),
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (cancelled) return;
          // A below-minimum order comes back 200 with a per-method error and a zero
          // payout, so the error has to be read before the amount.
          const reason = ok ? readPaybisError(side, json) : null;
          setSettled(
            ok && !reason
              ? { key, quote: readPaybisQuote(side, json), error: null }
              : { key, quote: null, error: reason ?? (typeof json?.error === "string" ? json.error : "No quote") },
          );
        })
        .catch(() => {
          if (!cancelled) setSettled({ key, quote: null, error: "Quote unavailable" });
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, side, amount, fiat]);

  const current = settled.key === key;
  return {
    quote: current ? settled.quote : null,
    loading: Boolean(key) && !current,
    error: current ? settled.error : null,
  };
}
