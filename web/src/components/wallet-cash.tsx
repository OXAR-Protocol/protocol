"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { TokenIcon } from "@/components/token-icon";
import { MoneyActions } from "@/components/money-actions";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useLiveBalances } from "@/hooks/use-live-balances";
import { useT } from "@/lib/i18n";

/** Below this we treat wallet cash as dust: no chips, and no nudge to invest it. */
const MIN_SHOWN_USD = 1;
const MAX_CHIPS = 4;

/**
 * Money the user holds in their wallet but hasn't put to work yet (uninvested).
 * Separate from the "sleeping money" hero, which is the invested balance.
 *
 * Topping up belongs HERE, beside the wallet — this is the figure a deposit
 * changes. It used to sit up by the invested balance, which is money that is
 * already placed; adding to it there implied the dollars would land somewhere
 * they don't. The same reason the block renders at $0.00 instead of hiding: an
 * empty wallet is exactly who needs the plus.
 */
export function WalletCash() {
  const { t } = useT();
  const { assets, loading, refreshSilently } = useWalletAssets();
  // The figure someone stares at right after topping up, so it gets the same live
  // trigger. A second subscription on the same socket costs nothing worth counting,
  // and it keeps each component the owner of its own data.
  useLiveBalances(refreshSilently);

  const total = assets.reduce((sum, a) => sum + a.usdValue, 0);
  if (loading) return null;

  const worthShowing = total >= MIN_SHOWN_USD;
  const chips = assets.slice(0, MAX_CHIPS);
  const extra = assets.length - chips.length;

  return (
    <section className="mb-12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">{t("home.wallet.label")}</p>
          {/* The hero scale, taken from the balance below: what you can act on now
              leads, and what already works follows it a size down. */}
          <p className="mt-2 text-[clamp(2.5rem,6vw,4rem)] font-light leading-none tracking-[-0.02em] text-black tabular-nums">
            ${total.toFixed(2)}
          </p>
        </div>
        <MoneyActions />
      </div>

      {worthShowing && (
        <>
          {/* What's sitting there — a few asset chips for tangibility. */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((a) => (
              <span
                key={`${a.chain}:${a.network ?? ""}:${a.mint}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 py-1 pl-1 pr-2.5"
              >
                <TokenIcon asset={a} className="h-4 w-4" />
                <span className="text-[11px] text-black/60">
                  ${a.usdValue.toFixed(2)} {a.symbol}
                </span>
              </span>
            ))}
            {extra > 0 && <span className="text-[11px] text-black/40">+{extra}</span>}
          </div>

          <Link
            href="/market"
            data-tour="deposit"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85"
          >
            {t("home.wallet.cta")}
            <ArrowUpRight size={14} strokeWidth={1.5} />
          </Link>
        </>
      )}
    </section>
  );
}
