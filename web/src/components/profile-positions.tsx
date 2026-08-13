"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2 } from "lucide-react";

import { PositionRow } from "@/components/position-row";
import { useYieldPositions, type ProviderView } from "@/hooks/use-yield-positions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { useEarnedById } from "@/hooks/use-earnings";
import { isPriceExposure } from "@/lib/yield/assets";
import { useT } from "@/lib/i18n";

/** Enough to see what you hold without the page becoming the portfolio. */
const SHOWN = 5;

/**
 * What the line above is made of.
 *
 * A chart of a total, with no way to see what's inside it, asks you to take the
 * figure on faith. The biggest few positions answer that in place; the rest are one
 * tap away rather than repeated here, because the portfolio page is where holdings
 * get filters, layouts and multi-select — and one of the two screens has to be the
 * real one.
 */
export function ProfilePositions() {
  const { t } = useT();
  const router = useRouter();
  const { views, loading } = useYieldPositions();

  const held = views
    .filter((v) => v.underlyingBalance > BigInt(0))
    .sort((a, b) => Number(b.underlyingBalance) / 10 ** b.decimals - Number(a.underlyingBalance) / 10 ** a.decimals);
  const shown = held.slice(0, SHOWN);

  const priceMints = shown.filter((v) => isPriceExposure(v.id) && v.heldMint).map((v) => v.heldMint as string);
  const { prices } = useStockPrices(priceMints);
  const charts = useStockCharts();
  const earnedById = useEarnedById();
  const change24hOf = (v: ProviderView) =>
    isPriceExposure(v.id) && v.heldMint ? prices[v.heldMint]?.change24h : undefined;

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-black/25">
        <Loader2 size={16} className="animate-spin" />
      </div>
    );
  }

  if (!held.length) {
    return (
      <div className="rounded-[12px] border border-black/10 bg-white p-8 text-center">
        <p className="text-[14px] text-black">{t("pile.empty.title")}</p>
        <p className="mt-1 text-[12px] text-black/45">{t("pile.empty.body")}</p>
        <Link
          href="/market"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85"
        >
          {t("pile.explore")}
          <ArrowUpRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {shown.map((v) => (
          <PositionRow
            key={v.id}
            view={v}
            onOpen={() => router.push(`/asset/${v.id}`)}
            change24h={change24hOf(v)}
            chart={v.heldMint ? charts[v.heldMint] : undefined}
            earned={earnedById[v.id]}
            picked={false}
          />
        ))}
      </div>

      {held.length > shown.length && (
        <Link
          href="/portfolio"
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] lowercase tracking-wide text-black/45 transition hover:text-black"
        >
          {t("profile.allPositions", { n: String(held.length) })}
          <ArrowUpRight size={13} strokeWidth={1.5} />
        </Link>
      )}
    </>
  );
}
