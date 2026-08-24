"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PhotoBg } from "@/components/photo-bg";
import { TokenIcon } from "@/components/token-icon";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useLiveBalances } from "@/hooks/use-live-balances";
import { USDC_MINT } from "@/lib/constants";
import { useT } from "@/lib/i18n";

/** Below this we treat wallet cash as dust: no chips, and no nudge to invest it. */
const MIN_SHOWN_USD = 1;
const MAX_CHIPS = 3;

/**
 * Money that isn't doing anything, and the way to change that.
 *
 * This card used to carry the two halves of the total — what's working and what's
 * free — and it sat below the chart, which is below the analytics, which is below
 * the fold. Both figures now sit directly under the balance they break down (see
 * `MoneySplit`), where the second question a person asks gets answered next to the
 * first.
 *
 * What could not move up is what's left here: the coins the wallet holds that aren't
 * dollars, and the one act that puts idle money to work. With nothing idle there is
 * nothing to say, so the card doesn't appear at all rather than stating a zero.
 */
export function MoneyPanel() {
  const { t } = useT();
  const { assets, refreshSilently } = useWalletAssets();
  const cash = useUsdcBalance();
  // Money that moves shows up without a reload; a second subscription on the same
  // socket costs nothing worth counting.
  const refreshCash = cash.refresh;
  useLiveBalances(
    useCallback(() => {
      refreshSilently();
      refreshCash();
    }, [refreshSilently, refreshCash]),
  );

  const otherCoins = assets.filter((a) => a.mint !== USDC_MINT);
  const idle = (cash.usd ?? 0) >= MIN_SHOWN_USD || otherCoins.length > 0;
  if (!idle) return null;

  const chips = otherCoins.slice(0, MAX_CHIPS);

  return (
    <section className="relative overflow-hidden rounded-card border border-ink/10 bg-paper p-5">
      <PhotoBg src="/art/dripping-dollar.webp" scrim="left" position="object-[right_top]" opacity="opacity-25" />

      <p className="relative text-[11px] lowercase tracking-wide text-ink/40">
        {t("home.wallet.idle")}
      </p>

      {chips.length > 0 && (
        <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((a) => (
            <span
              key={a.mint}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 py-1 pl-1 pr-2.5"
            >
              <TokenIcon asset={a} className="h-4 w-4" />
              <span className="text-[11px] text-ink/60">
                ${a.usdValue.toFixed(2)} {a.symbol}
              </span>
            </span>
          ))}
          {otherCoins.length > chips.length && (
            <span className="text-[11px] text-ink/40">+{otherCoins.length - chips.length}</span>
          )}
        </div>
      )}

      <Link
        href="/market"
        data-tour="deposit"
        className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
      >
        {t("home.wallet.cta")}
        <ArrowUpRight size={14} strokeWidth={1.5} />
      </Link>
    </section>
  );
}
