"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { TokenIcon } from "@/components/token-icon";
import { PhotoBg } from "@/components/photo-bg";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useT } from "@/lib/i18n";

/** Below this we treat wallet cash as dust and don't nag the user about it. */
const MIN_SHOWN_USD = 1;
const MAX_CHIPS = 4;

/**
 * Money the user holds in their wallet but hasn't put to work yet (uninvested).
 * Separate from the "sleeping money" hero, which is the invested balance. Nudges
 * the user to move idle cash into a source. Hidden when there's only dust.
 */
export function WalletCash() {
  const { t } = useT();
  const { assets, loading } = useWalletAssets();

  const total = assets.reduce((sum, a) => sum + a.usdValue, 0);
  if (loading || total < MIN_SHOWN_USD) return null;

  const chips = assets.slice(0, MAX_CHIPS);
  const extra = assets.length - chips.length;

  return (
    <Link
      href="/yield"
      className="group relative mb-12 block overflow-hidden rounded-[12px] border border-black/10 bg-white p-5 transition-colors hover:border-black/30"
    >
      <PhotoBg src="/art/dripping-dollar.webp" scrim="left" position="object-[right_top]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">{t("home.wallet.label")}</p>
          <p className="mt-2 text-[clamp(1.5rem,3.5vw,2.25rem)] font-light leading-none text-black tabular-nums">
            ${total.toFixed(2)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] font-medium lowercase tracking-wide text-white transition group-hover:bg-black/85">
          {t("home.wallet.cta")}
          <ArrowUpRight size={14} strokeWidth={1.5} />
        </span>
      </div>

      {/* What's sitting there — a few asset chips for tangibility. */}
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
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
    </Link>
  );
}
