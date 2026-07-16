"use client";

import { useEffect, useState } from "react";

import { USDC_MINT } from "@/lib/constants";
import { toBaseUnits } from "@/lib/yield";
import { getSwapQuote } from "@oxar/sdk";

export interface SwapInPreview {
  /** Position value you'll hold right after buying (USD), at mid-price. */
  valueUsd: number | null;
  /** USD lost to the swap (what you pay − what you'll hold). */
  spreadUsd: number | null;
  quoting: boolean;
}

const EMPTY: SwapInPreview = { valueUsd: null, spreadUsd: null, quoting: false };

/**
 * Previews a swap-and-hold buy (Ondo / stocks): quotes USDC → `heldMint` for the
 * entered USD and values the output at mid-price, so the user sees what they'll
 * actually hold (and the swap cost) BEFORE buying — no surprise minus afterward.
 * Debounced; only runs when a held mint is set.
 */
export function useSwapInPreview(params: {
  heldMint?: string;
  heldDecimals?: number;
  usdAmount: number;
  enabled: boolean;
}): SwapInPreview {
  const { heldMint, heldDecimals, usdAmount, enabled } = params;
  const [state, setState] = useState<SwapInPreview>(EMPTY);

  useEffect(() => {
    if (!enabled || !heldMint || !heldDecimals || usdAmount <= 0) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, quoting: true }));
    const t = setTimeout(async () => {
      try {
        const amount = toBaseUnits(usdAmount.toFixed(6), 6); // USDC base units
        const [quote, priceJson] = await Promise.all([
          getSwapQuote({ inputMint: USDC_MINT, outputMint: heldMint, amount, asLegacy: true, slippageBps: 100 }),
          fetch(`https://lite-api.jup.ag/price/v3?ids=${heldMint}`).then((r) => r.json()),
        ]);
        const out = Number(quote.outAmount) / 10 ** heldDecimals;
        const price = (priceJson as Record<string, { usdPrice?: number } | undefined>)[heldMint]?.usdPrice ?? 0;
        const valueUsd = out * price;
        if (!cancelled) {
          setState({
            valueUsd,
            spreadUsd: valueUsd > 0 ? Math.max(usdAmount - valueUsd, 0) : null,
            quoting: false,
          });
        }
      } catch {
        if (!cancelled) setState(EMPTY);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [heldMint, heldDecimals, usdAmount, enabled]);

  return state;
}
