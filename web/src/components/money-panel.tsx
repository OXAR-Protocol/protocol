"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { PhotoBg } from "@/components/photo-bg";
import { TokenIcon } from "@/components/token-icon";
import { MoneyActions } from "@/components/money-actions";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useLiveBalances } from "@/hooks/use-live-balances";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { USDC_MINT } from "@/lib/constants";
import { useT } from "@/lib/i18n";

/** Below this we treat wallet cash as dust: no chips, and no nudge to invest it. */
const MIN_SHOWN_USD = 1;
const MAX_CHIPS = 3;

/**
 * The two halves of what the total above is: money at work, and money that isn't.
 *
 * It used to lead the page with the wallet balance, and the portfolio total came
 * after — so the first number you met was a part, the second was the whole, and
 * nothing said which was which. The whole goes first now; this panel breaks it in
 * two and puts the acts beside the half they change.
 */
export function MoneyPanel() {
  const { t } = useT();
  const { assets, refreshSilently } = useWalletAssets();
  const { totalUsdc } = useAggregatePersonalBalance();
  // "Free to use" is the dollars, read off the chain — the same figure the money
  // sheet and the buying screen show. Everything else the wallet holds is a coin you
  // could spend, not a dollar you have, and it is listed as chips underneath.
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
  const chips = otherCoins.slice(0, MAX_CHIPS);

  return (
    <section className="relative overflow-hidden rounded-[12px] border border-ink/10 bg-paper p-5">
      <PhotoBg src="/art/dripping-dollar.webp" scrim="left" position="object-[right_top]" opacity="opacity-25" />

      <div className="relative flex items-start justify-between gap-4">
        <p className="text-[11px] lowercase tracking-wide text-ink/40">{t("money.title")}</p>
        <MoneyActions />
      </div>

      {/* Working first: it is the part that answers "is my money doing anything". */}
      <div className="relative mt-4">
        <p className="text-[11px] lowercase tracking-wide text-ink/40">{t("money.working")}</p>
        <p className="mt-1 text-[clamp(1.6rem,3vw,2rem)] font-light leading-none tracking-[-0.02em] tabular-nums text-ink">
          ${formatUsdAmount(totalUsdc)}
        </p>
      </div>

      <div className="relative mt-5 border-t border-ink/[0.07] pt-4">
        <p className="text-[11px] lowercase tracking-wide text-ink/40">{t("money.free")}</p>
        <p className="mt-1 text-[clamp(1.6rem,3vw,2rem)] font-light leading-none tracking-[-0.02em] tabular-nums text-ink">
          {cash.usd === null ? "—" : `$${formatUsdAmount(cash.usd)}`}
        </p>

        {idle && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
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

            <Link
              href="/market"
              data-tour="deposit"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-medium lowercase tracking-wide text-paper transition hover:bg-ink/85"
            >
              {t("home.wallet.cta")}
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
