"use client";

import { useEffect, useState } from "react";

import { USDC_MINT } from "@/lib/constants";
import { getSwapQuote, toBaseUnits, exitCostFraction, exitCostBand, type ExitCostBand } from "@oxar/sdk";

export interface ExitCostPreview {
  /** Fraction of the buy amount that a same-instant exit would lose. */
  fraction: number | null;
  band: ExitCostBand;
  loading: boolean;
  /** No usable SELL quote right now (no route / rate-limited) — never a hard error. */
  unavailable: boolean;
}

const EMPTY: ExitCostPreview = { fraction: null, band: "none", loading: false, unavailable: false };

// Below this, the round trip is dust — a quote failure here reads as a false
// alarm, not a real signal, so we don't even ask Jupiter.
const MIN_QUOTABLE_USD = 1;
const DEBOUNCE_MS = 500;

/**
 * Previews what leaving would cost, quoted BEFORE the buy: takes the USD the
 * user is about to spend and the asset's reference price (whatever the buy
 * panel already fetched — no second price feed here), estimates the units that
 * buys, then quotes a live SELL of that amount back to USDC. The gap between
 * the USD spent and what an immediate exit would return is the exit cost.
 *
 * This prices the SELL leg only — the buy panel already shows the buy-side
 * spread separately (`useSwapInPreview`). Reusing `getSwapQuote` (the same
 * Jupiter client the sell-preview and deposit paths use) rather than a second
 * client is deliberate: one quoting implementation, one set of route/slippage
 * assumptions.
 *
 * Debounced so typing doesn't spam Jupiter; in-flight work is cancelled on
 * unmount or when the inputs change again. Never throws into the UI — a bad or
 * missing route just reports `unavailable`.
 */
export function useExitCost(params: {
  mint?: string;
  decimals?: number;
  usdAmount: number;
  /** USD per whole unit — the same reference price the buy panel displays. */
  priceUsd?: number;
  enabled: boolean;
}): ExitCostPreview {
  const { mint, decimals, usdAmount, priceUsd, enabled } = params;
  const [state, setState] = useState<ExitCostPreview>(EMPTY);

  useEffect(() => {
    if (
      !enabled ||
      !mint ||
      !decimals ||
      !priceUsd ||
      priceUsd <= 0 ||
      !Number.isFinite(usdAmount) ||
      usdAmount < MIN_QUOTABLE_USD
    ) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, unavailable: false }));
    const timer = setTimeout(async () => {
      try {
        const units = usdAmount / priceUsd;
        const amount = toBaseUnits(units, decimals);
        if (amount <= BigInt(0)) {
          if (!cancelled) setState(EMPTY);
          return;
        }
        const quote = await getSwapQuote({
          inputMint: mint,
          outputMint: USDC_MINT,
          amount,
          asLegacy: true,
          slippageBps: 100,
        });
        const usdOut = Number(quote.outAmount) / 1e6;
        const fraction = exitCostFraction(usdAmount, usdOut);
        if (!cancelled) {
          setState({
            fraction,
            band: exitCostBand(fraction),
            loading: false,
            // A quote that came back but produced no usable fraction is as good
            // as no quote — surface it the same way rather than a silent blank.
            unavailable: fraction === null,
          });
        }
      } catch {
        // No route / rate-limited: never a hard error, just "can't say right now".
        if (!cancelled) setState({ ...EMPTY, unavailable: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mint, decimals, usdAmount, priceUsd, enabled]);

  return state;
}
