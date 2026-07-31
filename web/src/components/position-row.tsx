"use client";

import { ArrowUpRight } from "lucide-react";

import { floorTo } from "@oxar/sdk";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { LiveAmount } from "@/components/live-amount";
import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { Sparkline } from "@/components/sparkline";
import { PickButton } from "@/components/pick-button";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { isPriceExposure } from "@/lib/yield/assets";
import { RISK_TONE, fromBaseUnits, unitLabelOf } from "@/lib/yield";
import { useT } from "@/lib/i18n";

interface Props {
  view: ProviderView;
  onOpen: () => void;
  /** 24h move for price-exposure rows — shown instead of a meaningless APY. */
  change24h?: number;
  /** Batched price series for the inline sparkline. */
  chart?: number[];
  /** Profit since this was bought (on-chain cost basis). Absent when the engine
   *  can't attribute the position — nothing shown beats a confident zero. */
  earned?: number;
  picked: boolean;
  /** Absent when picking is off — the row then renders no pick control at all. */
  onTogglePick?: () => void;
}

/**
 * One held position, as a row: ticker leads, name underneath, the chart in the
 * middle, value on the right — the same shape as the browse rows on /market, so a
 * thing you own and a thing you could own don't look like different species.
 */
export function PositionRow({ view, onOpen, change24h, chart, earned, picked, onTogglePick }: Props) {
  const { t } = useT();
  const value = fromBaseUnits(view.underlyingBalance, view.decimals);

  return (
    <button
      onClick={onOpen}
      className={`group relative isolate w-full overflow-hidden rounded-[8px] border bg-white p-5 text-left transition-colors ${
        picked ? "border-black/40 ring-1 ring-black/10" : "border-black/10 hover:border-black/30"
      }`}
    >
      <BanknoteBg seed={view.id} />
      <div className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AssetIcon src={assetLogoSrc(view.id)} label={assetIconLabel(view.id, view.assetSymbol)} size={36} />
          <div className="min-w-0">
            <p className="text-base text-black">{unitLabelOf(view)}</p>
            <p className="mt-0.5 truncate text-xs text-black/45">{view.name.replace(/\s*\([^)]*\)$/, "")}</p>
            {/* How much you own, not only what it's worth. */}
            {isPriceExposure(view.id) && view.heldDecimals !== undefined && view.shares > BigInt(0) && (
              <p className="mt-1 text-[11px] tabular-nums text-[#3c05c7]/80">
                {floorTo(Number(view.shares) / 10 ** view.heldDecimals, 6)} {unitLabelOf(view)}
              </p>
            )}
          </div>
        </div>

        {/* The same batched series the grid cards use — one request for every row,
            so a chart per position costs nothing extra. */}
        {isPriceExposure(view.id) && (chart?.length ?? 0) > 1 && (
          <div className="mx-4 hidden max-w-[140px] flex-1 sm:block">
            <Sparkline
              values={chart!}
              className={(change24h ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}
            />
          </div>
        )}

        {/* Collecting a set, not ticking a table — so it reads as an action on the
            right, where the other actions are. */}
        {onTogglePick && (
          <PickButton picked={picked} onToggle={onTogglePick} label={t("bulk.select", { name: view.name })} />
        )}

        <div className="shrink-0 text-right">
          <LiveAmount value={value} apy={view.apy} variant="md" />
          {typeof change24h === "number" ? (
            <p className={`text-[11px] tabular-nums ${change24h >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {change24h >= 0 ? "+" : ""}
              {change24h.toFixed(2)}% 24h
            </p>
          ) : (
            <p className={`text-[11px] lowercase tracking-wide ${RISK_TONE[view.riskLevel] ?? "text-black/45"}`}>
              {(view.apy * 100).toFixed(2)}% APY
            </p>
          )}
          {/* Which of your holdings is actually down. The card above says what the
              whole portfolio did; only a per-position figure answers "which one". */}
          {typeof earned === "number" && Math.abs(earned) >= 0.005 && (
            <p className={`text-[11px] tabular-nums ${earned >= 0 ? "text-black/40" : "text-red-600"}`}>
              {earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)} {t("position.sinceBuy")}
            </p>
          )}
        </div>
        <ArrowUpRight size={16} strokeWidth={1.5} className="shrink-0 text-black/40 transition group-hover:text-black" />
      </div>
    </button>
  );
}
