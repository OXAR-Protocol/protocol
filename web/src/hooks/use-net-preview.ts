"use client";

import { useEffect, useState } from "react";

import { getSwapQuote, platformFeeUsd, usdToBase, type WalletAsset } from "@oxar/sdk";
import { usePlatformFeeBps } from "@/hooks/use-platform-fee";

export interface NetPreview {
  kind: "direct" | "swap";
  /** Guaranteed-min USDC the deposit will receive, in display units. */
  netUsdc: number | null;
  quoting: boolean;
  feeUsd?: number;
  etaSec?: number;
}

/**
 * Live "you'll deposit ~$X" preview for the pay-asset: the full amount when it's
 * already the product's currency, else a Jupiter swap's guaranteed minimum.
 * Debounced; cancels in-flight quotes on change.
 */
export function useNetPreview(params: {
  payAsset: WalletAsset | null;
  usdAmount: number;
  productMint: string;
  productDecimals: number;
}): NetPreview {
  const { payAsset, usdAmount, productMint, productDecimals } = params;
  const isDirect = payAsset?.mint === productMint;
  const kind: NetPreview["kind"] = !payAsset || isDirect ? "direct" : "swap";
  const feeBps = usePlatformFeeBps();

  const [state, setState] = useState<Omit<NetPreview, "kind">>({ netUsdc: null, quoting: false });

  useEffect(() => {
    if (!payAsset || usdAmount <= 0) {
      setState({ netUsdc: null, quoting: false });
      return;
    }
    if (isDirect) {
      setState({ netUsdc: usdAmount, quoting: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, quoting: true }));
    const t = setTimeout(async () => {
      try {
        const q = await getSwapQuote({
          inputMint: payAsset.mint,
          outputMint: productMint,
          amount: usdToBase(payAsset, usdAmount),
        });
        const gross = Number(q.otherAmountThreshold) / 10 ** productDecimals;
        if (!cancelled) setState({ netUsdc: gross - platformFeeUsd(gross, feeBps), quoting: false });
      } catch {
        if (!cancelled) setState({ netUsdc: null, quoting: false });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [payAsset, usdAmount, isDirect, productMint, productDecimals, feeBps]);

  return { kind, ...state };
}
