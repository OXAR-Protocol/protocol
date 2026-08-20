"use client";

import { useMemo } from "react";

import { spendableUsd, type WalletAsset } from "@oxar/sdk";

import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useYieldPositions, type ProviderView } from "@/hooks/use-yield-positions";
import { useSolanaContext } from "@/providers/solana-provider";
import { koraEnabled } from "@/lib/gas/kora";
import { fromBaseUnits, positionTitle } from "@/lib/yield";
import { assetLogoSrc } from "@/lib/yield/asset-logo";
import { USDC_MINT } from "@/lib/constants";

/** Below this the swap costs more in spread than it returns in dollars. */
export const MIN_CASH_USD = 1;

/** A loose coin in the wallet: turned into dollars by a swap. */
export interface CashableCoin {
  kind: "coin";
  key: string;
  symbol: string;
  /** Dollars it can produce, net of any gas reserve. */
  usd: number;
  /** Second line: how much of the thing itself. */
  detail: string;
  asset: WalletAsset;
}

/** Something you bought: turned into dollars by selling it. */
export interface CashablePosition {
  kind: "position";
  key: string;
  symbol: string;
  usd: number;
  detail: string;
  logo?: string;
  view: ProviderView;
}

export type Cashable = CashableCoin | CashablePosition;

/**
 * Everything that can become dollars, in one list.
 *
 * The wallet's loose coins and the things you bought reach dollars by different
 * roads — a swap for one, a sale for the other — but that is our plumbing, not a
 * distinction worth making someone learn. Asked "what can I turn into money", the
 * honest answer is: all of it.
 *
 * Sorted by what each is worth, because the thing you meant is almost always the
 * biggest one.
 */
export function useCashable(): {
  items: Cashable[];
  /** The dollars themselves — not in `items` (they are already money), but every
   *  screen that asks "what do you want to pay with" has to offer them first. */
  dollars: { usd: number; asset: WalletAsset | null };
  /** The raw coin list, for callers that plan their own conversions. */
  assets: WalletAsset[];
  loading: boolean;
  /** Re-read the coins after something moved — a conversion, a sale. */
  refresh: () => void;
} {
  const { assets, loading: coinsLoading, refreshSilently } = useWalletAssets();
  const { views, loading: positionsLoading } = useYieldPositions();
  const { isExternal } = useSolanaContext();
  const reserveGas = !koraEnabled() || isExternal;

  const items = useMemo(() => {
    const coins: Cashable[] = assets
      .filter((a) => a.mint !== USDC_MINT)
      .map((a) => ({
        kind: "coin" as const,
        key: `coin:${a.mint}`,
        symbol: a.symbol,
        usd: spendableUsd(a, reserveGas),
        detail: `${Number(a.uiAmount.toPrecision(4))} ${a.symbol}`,
        asset: a,
      }));

    const positions: Cashable[] = views
      .filter((v) => v.underlyingBalance > BigInt(0))
      .map((v) => ({
        kind: "position" as const,
        key: `position:${v.id}`,
        symbol: positionTitle(v),
        usd: fromBaseUnits(v.underlyingBalance, v.decimals),
        detail: v.name,
        logo: assetLogoSrc(v.id),
        view: v,
      }));

    return [...coins, ...positions].filter((c) => c.usd >= MIN_CASH_USD).sort((a, b) => b.usd - a.usd);
  }, [assets, views, reserveGas]);

  const dollars = useMemo(() => {
    const usdc = assets.find((a) => a.mint === USDC_MINT) ?? null;
    return { usd: usdc ? spendableUsd(usdc, reserveGas) : 0, asset: usdc };
  }, [assets, reserveGas]);

  return { items, dollars, assets, loading: coinsLoading || positionsLoading, refresh: refreshSilently };
}
