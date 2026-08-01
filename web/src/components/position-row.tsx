"use client";

import { ArrowUpRight } from "lucide-react";

import { floorTo } from "@oxar/sdk";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { LiveAmount } from "@/components/live-amount";
import { AssetIcon } from "@/components/asset-icon";
import { MarketRow } from "@/components/market-row";
import { Sparkline } from "@/components/sparkline";
import { PickButton } from "@/components/pick-button";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { isPriceExposure } from "@/lib/yield/assets";
import { RISK_TONE, fromBaseUnits, positionTitle, unitLabelOf } from "@/lib/yield";
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
 * One held position, as a row — the same `MarketRow` shell the browse rows on
 * /market use, so a thing you own and a thing you could own don't look like
 * different species. That includes the pick control keeping its words here: this
 * row used to shrink it to a bare "+" on a phone, which said nothing about what
 * tapping it would do.
 */
export function PositionRow({ view, onOpen, change24h, chart, earned, picked, onTogglePick }: Props) {
  const { t } = useT();
  const value = fromBaseUnits(view.underlyingBalance, view.decimals);
  const title = positionTitle(view);
  // The full name, unless it would just say the title twice.
  const full = view.name.replace(/\s*\([^)]*\)$/, "");
  const subtitle = full === title ? null : full;

  return (
    <MarketRow
      seed={view.id}
      onOpen={onOpen}
      selected={picked}
      lead={
        <div className="flex min-w-0 items-center gap-3">
          <AssetIcon src={assetLogoSrc(view.id)} label={assetIconLabel(view.id, view.assetSymbol)} size={36} />
          <div className="min-w-0">
            {/* Truncate, don't spill: without this the title ran out of its squeezed
                column and under the pick pill on a phone. */}
            <p className="truncate text-base text-black">{title}</p>
            {subtitle && <p className="mt-0.5 truncate text-xs text-black/45">{subtitle}</p>}
            {/* How much you own, not only what it's worth. */}
            {isPriceExposure(view.id) && view.heldDecimals !== undefined && view.shares > BigInt(0) && (
              <p className="mt-1 text-[11px] tabular-nums text-[#3c05c7]/80">
                {floorTo(Number(view.shares) / 10 ** view.heldDecimals, 6)} {unitLabelOf(view)}
              </p>
            )}
          </div>
        </div>
      }
      // The same batched series the grid cards use — one request for every row,
      // so a chart per position costs nothing extra.
      chart={
        isPriceExposure(view.id) && (chart?.length ?? 0) > 1 ? (
          <Sparkline
            values={chart!}
            className={(change24h ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}
          />
        ) : null
      }
      figure={
        <>
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
        </>
      }
      // Collecting a set, not ticking a table — so it reads as an action on the
      // right, where the other actions are.
      pick={
        onTogglePick ? (
          <PickButton
            picked={picked}
            onToggle={onTogglePick}
            label={t("bulk.select", { name: view.name })}
          />
        ) : null
      }
      trailing={
        <ArrowUpRight size={16} strokeWidth={1.5} className="shrink-0 text-black/40 transition group-hover:text-black" />
      }
    />
  );
}
