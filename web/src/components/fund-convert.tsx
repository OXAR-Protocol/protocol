"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { formatUsdAmount, spendableUsd, type WalletAsset } from "@oxar/sdk";

import { AmountKeypad } from "@/components/amount-keypad";
import { AnimatedAmount } from "@/components/animated-amount";
import { SheetRow } from "@/components/sheet-row";
import { TokenIcon } from "@/components/token-icon";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useBulkFunding } from "@/hooks/use-bulk-funding";
import { useSolanaContext } from "@/providers/solana-provider";
import { koraEnabled } from "@/lib/gas/kora";
import { toFriendlyError } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { useT, localizeError } from "@/lib/i18n";

/** Below this the swap costs more in spread than it returns in dollars. */
const MIN_CONVERT_USD = 1;
const FRACTIONS = [0.25, 0.5, 1] as const;

/**
 * Other money, made spendable.
 *
 * Coins used to double as a way to pay: the buy panel would swap whatever you held
 * on the way into a purchase. That hid a trade inside a purchase. Now buying spends
 * dollars only, and this is the one place a coin becomes dollars — a deliberate act,
 * on an amount you choose rather than the whole balance.
 *
 * What ISN'T here: anything you bought. A position is sold on its own page, where
 * the price it's worth, what it cost you and the spread out are all on screen. The
 * same swap run from a list of coins would be a second, blinder way to sell.
 */
export function FundConvert({ onConverted }: { onConverted: () => void }) {
  const { t } = useT();
  const { assets, loading, refresh } = useWalletAssets();
  const { fundUsdc, converting } = useBulkFunding();
  const { isExternal } = useSolanaContext();
  const [picked, setPicked] = useState<WalletAsset | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reserveGas = !koraEnabled() || isExternal;
  const coins = assets
    .filter((a) => a.chain === "solana" && a.mint !== USDC_MINT)
    .map((a) => ({ asset: a, usd: spendableUsd(a, reserveGas) }))
    .filter((c) => c.usd >= MIN_CONVERT_USD)
    .sort((a, b) => b.usd - a.usd);

  const available = picked ? spendableUsd(picked, reserveGas) : 0;
  const typed = Number(amount);
  const ready = Number.isFinite(typed) && typed >= MIN_CONVERT_USD && typed <= available;

  const convert = async () => {
    if (!picked || !ready) return;
    setError(null);
    try {
      await fundUsdc(picked, typed);
      await refresh();
      onConverted();
    } catch (e) {
      console.error("Converting to dollars failed:", e);
      setError(toFriendlyError(e));
    }
  };

  if (loading) return <p className="text-[13px] text-black/45">{t("deposit.loadingAssets")}</p>;

  if (picked) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPicked(null)}
          disabled={converting}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] lowercase text-black/40 transition hover:text-black disabled:opacity-40"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          {t("fund.back")}
        </button>

        <p className="text-center text-[2.6rem] font-light leading-none tracking-[-0.03em] text-black">
          <span className={amount === "" ? "text-black/25" : "text-black/45"}>$</span>
          <AnimatedAmount value={amount} />
        </p>
        <p className="mt-2 flex items-center justify-center gap-2 text-[12px] text-black/45">
          <TokenIcon asset={picked} className="h-5 w-5 shrink-0 rounded-full" />
          {t("convert.available", { value: `$${formatUsdAmount(available)}`, sym: picked.symbol })}
        </p>

        <div className="mt-4 flex gap-1.5">
          {FRACTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAmount((available * f).toFixed(2))}
              className="flex-1 rounded-full border border-black/15 py-1.5 text-[11px] lowercase tracking-wide text-black/55 transition hover:border-black/40 hover:text-black"
            >
              {f === 1 ? t("rail.max") : `${f * 100}%`}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <AmountKeypad value={amount} onChange={setAmount} />
        </div>

        <button
          type="button"
          onClick={convert}
          disabled={!ready || converting}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3.5 text-[14px] lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-25"
        >
          {converting && <Loader2 size={14} className="animate-spin" />}
          {t("convert.action", { sym: picked.symbol })}
        </button>

        <p className="mt-3 text-center text-[11px] leading-snug text-black/40">{t("convert.rate")}</p>
        {error && <p className="mt-3 text-center text-xs text-red-500">{localizeError(error, t)}</p>}
      </>
    );
  }

  return (
    <>
      <p className="mb-3 text-[13px] leading-snug text-black/50">{t("convert.hint")}</p>

      {coins.length === 0 ? (
        <p className="text-[13px] leading-snug text-black/50">{t("convert.nothing")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {coins.map(({ asset, usd }) => (
            <SheetRow
              key={asset.mint}
              leading={<TokenIcon asset={asset} className="h-10 w-10 shrink-0 rounded-full" />}
              title={asset.symbol}
              body={`${Number(asset.uiAmount.toPrecision(4))} ${asset.symbol}`}
              trailing={
                <span className="shrink-0 text-[14px] tabular-nums text-black">${formatUsdAmount(usd)}</span>
              }
              onClick={() => {
                setPicked(asset);
                setAmount("");
                setError(null);
              }}
            />
          ))}
        </div>
      )}

      {/* Where the rest of it is. Someone looking for the ONyc they bought is right
          to expect it in a list of what they hold — it just isn't sold from here. */}
      <p className="mt-4 text-[11px] leading-snug text-black/40">
        {t("convert.positionsElsewhere")}{" "}
        <Link href="/you" className="underline decoration-black/20 underline-offset-2 hover:text-black">
          {t("convert.positionsLink")}
        </Link>
      </p>
    </>
  );
}
