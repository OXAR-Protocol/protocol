"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { formatUsdAmount, spendableUsd, type WalletAsset } from "@oxar/sdk";

import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useBulkFunding } from "@/hooks/use-bulk-funding";
import { useSolanaContext } from "@/providers/solana-provider";
import { koraEnabled } from "@/lib/gas/kora";
import { toFriendlyError } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { useT, localizeError } from "@/lib/i18n";

/** Below this the swap costs more in spread than it returns in dollars. */
const MIN_CONVERT_USD = 1;

/**
 * Other money, made spendable.
 *
 * Coins used to double as a way to pay: the buy panel would swap whatever you held
 * on the way into a purchase. That hid a trade inside a purchase. Now buying spends
 * dollars only, and this is the one place a coin becomes dollars — a deliberate act,
 * with the amount it's worth stated before it happens.
 */
export function FundConvert({ onConverted }: { onConverted: () => void }) {
  const { t } = useT();
  const { assets, loading, refresh } = useWalletAssets();
  const { fundUsdc, converting } = useBulkFunding();
  const { isExternal } = useSolanaContext();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reserveGas = !koraEnabled() || isExternal;
  const coins = assets
    .filter((a) => a.chain === "solana" && a.mint !== USDC_MINT)
    .map((a) => ({ asset: a, usd: spendableUsd(a, reserveGas) }))
    .filter((c) => c.usd >= MIN_CONVERT_USD)
    .sort((a, b) => b.usd - a.usd);

  const convert = async (asset: WalletAsset, usd: number) => {
    setError(null);
    setPending(asset.mint);
    try {
      await fundUsdc(asset, usd);
      await refresh();
      onConverted();
    } catch (e) {
      console.error("Converting to dollars failed:", e);
      setError(toFriendlyError(e));
    } finally {
      setPending(null);
    }
  };

  if (loading) return <p className="text-[13px] text-black/45">{t("deposit.loadingAssets")}</p>;

  if (!coins.length) {
    return <p className="text-[13px] leading-snug text-black/50">{t("convert.nothing")}</p>;
  }

  return (
    <>
      <p className="mb-3 text-[13px] leading-snug text-black/50">{t("convert.hint")}</p>
      <div className="flex flex-col gap-2">
        {coins.map(({ asset, usd }) => (
          <button
            key={asset.mint}
            type="button"
            disabled={converting}
            onClick={() => convert(asset, usd)}
            className="flex items-center gap-3 rounded-[10px] border border-black/12 px-4 py-3.5 text-left transition hover:border-black/40 disabled:opacity-50"
          >
            <span className="min-w-0">
              <span className="block text-[14px] text-black">{asset.symbol}</span>
              <span className="block text-[12px] leading-snug text-black/45">
                {asset.uiAmount.toPrecision(4)} {asset.symbol}
              </span>
            </span>
            <span className="ml-auto flex items-center gap-2 text-[13px] tabular-nums text-black">
              {pending === asset.mint && <Loader2 size={14} className="animate-spin text-black/45" />}
              ${formatUsdAmount(usd)}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[11px] leading-snug text-black/40">{t("convert.rate")}</p>
      {error && <p className="mt-3 text-center text-xs text-red-500">{localizeError(error, t)}</p>}
    </>
  );
}
