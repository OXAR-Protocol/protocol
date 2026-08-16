"use client";

import { useEffect, useState } from "react";

import { USDC_MINT } from "@/lib/constants";
import { toBaseUnits } from "@/lib/yield";
import { amountToSwapForWithdraw } from "@/lib/yield/swap-hold";
import { getSwapQuote, platformFeeUsd } from "@oxar/sdk";
import { usePlatformFeeBps } from "@/hooks/use-platform-fee";

export interface SwapOutPreview {
  /** USDC you'll actually receive for the requested amount. */
  proceedsUsd: number | null;
  /** Fraction of the requested amount lost to the market (0.024 = 2.4%). */
  costFraction: number | null;
  /** Our cut of the proceeds, in USD. Zero while we're not charging. */
  feeUsd: number;
  quoting: boolean;
}

const EMPTY: SwapOutPreview = { proceedsUsd: null, costFraction: null, feeUsd: 0, quoting: false };

/**
 * Previews a swap-and-hold SELL (stocks, gold, Ondo/Maple/OnRe): quotes
 * `heldMint → USDC` for the slice being sold, so the user sees what they'll receive
 * before signing. Mirrors `useSwapInPreview` on the buy side.
 *
 * This exists because we stopped BLOCKING expensive sells (see
 * `BROKEN_MARKET_IMPACT`): on a thin ticker a sell costs ~2% at any size, and the
 * old hard cap left holders unable to exit at all. Showing the number is the honest
 * form of that protection — the cost is the user's to accept.
 *
 * The slice is computed exactly as the provider will (`amountToSwapForWithdraw`), so
 * the preview matches what gets signed.
 */
export function useSwapOutPreview(params: {
  heldMint?: string;
  /** Held-token balance in base units (`ProviderView.shares`). */
  shares: bigint;
  /** Full position value in USD. */
  positionValue: number;
  /** USD the user asked to take out. */
  usdAmount: number;
  enabled: boolean;
}): SwapOutPreview {
  const { heldMint, shares, positionValue, usdAmount, enabled } = params;
  const feeBps = usePlatformFeeBps();
  const [state, setState] = useState<SwapOutPreview>(EMPTY);
  const sharesKey = shares.toString();

  useEffect(() => {
    if (!enabled || !heldMint || usdAmount <= 0 || positionValue <= 0 || shares <= BigInt(0)) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, quoting: true }));
    const t = setTimeout(async () => {
      try {
        const toSwap = amountToSwapForWithdraw(
          shares,
          toBaseUnits(positionValue.toFixed(6), 6),
          toBaseUnits(usdAmount.toFixed(6), 6),
        );
        if (toSwap <= BigInt(0)) {
          if (!cancelled) setState(EMPTY);
          return;
        }
        const quote = await getSwapQuote({
          inputMint: heldMint,
          outputMint: USDC_MINT,
          amount: toSwap,
          asLegacy: true,
          slippageBps: 100,
        });
        const gross = Number(quote.outAmount) / 1e6;
        // Ours comes off the dollars coming back, so what arrives is what's left.
        const feeUsd = platformFeeUsd(gross, feeBps);
        const proceedsUsd = gross - feeUsd;
        if (!cancelled) {
          setState({
            proceedsUsd,
            // Measured against the requested amount, not the quote's own impact figure:
            // this is what the user actually gives up, routing included.
            costFraction: Math.max(0, (usdAmount - proceedsUsd) / usdAmount),
            feeUsd,
            quoting: false,
          });
        }
      } catch {
        // No route / rate-limited: show nothing rather than a wrong number. The
        // provider still quotes at send time and reports a broken market itself.
        if (!cancelled) setState(EMPTY);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [heldMint, sharesKey, shares, positionValue, usdAmount, enabled, feeBps]);

  return state;
}

