"use client";

import { ArrowUpRight, Check } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { useApyHistory } from "@/hooks/use-apy-history";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { RISK_TONE, fromBaseUnits, unitLabelOf } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { Sparkline } from "@/components/sparkline";
import { trendUp, trendLineTone, trendTextTone } from "@/lib/yield/trend";
import { floorTo } from "@oxar/sdk";
import { LiveAmount } from "@/components/live-amount";
import { PickButton } from "@/components/pick-button";
import { useT } from "@/lib/i18n";
import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";

interface Props {
  view: ProviderView;
  onOpen: () => void;
  /** Picking for a multi-sell. Absent = the feature is off, and no control shows —
   *  the grid was the one view where a picked set was invisible. */
  picked?: boolean;
  onTogglePick?: () => void;
  /** 24h price change (%) for price-exposure assets — shown instead of APY. */
  change24h?: number;
  /** Profit since this was bought (on-chain cost basis), when we can attribute it. */
  earned?: number;
}

/** Grid ("квадратик") card for one source — APY trend for yield, price trend
 *  + 24h change for price-exposure assets (stocks/gold). */
export function PositionCard({ view, onOpen, change24h, earned, picked, onTogglePick }: Props) {
  const { t } = useT();
  const value = fromBaseUnits(view.underlyingBalance, view.decimals);
  const apyHistory = useApyHistory(view.defiLlamaPoolId);
  const charts = useStockCharts();

  const isPrice = isPriceExposure(view.id);
  const history = isPrice ? (view.heldMint ? charts[view.heldMint] ?? [] : []) : apyHistory;
  // Price assets know their direction from the 24h move; a yield source reads it
  // off the series it draws.
  const priceUp = isPrice ? (change24h ?? 0) >= 0 : trendUp(history);

  return (
    <button
      onClick={onOpen}
      className={`group relative isolate flex flex-col gap-4 overflow-hidden rounded-[8px] border bg-white p-5 text-left transition ${
        picked ? "border-black/40 ring-1 ring-black/10" : "border-black/10 hover:border-black/30"
      }`}
    >
      <BanknoteBg seed={view.id} />
      {onTogglePick && (
        <PickButton
          picked={!!picked}
          onToggle={onTogglePick}
          label={view.name}
          className="absolute right-3 top-3 z-10"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <AssetIcon src={assetLogoSrc(view.id)} label={assetIconLabel(view.id, view.assetSymbol)} size={32} />
          <div className="min-w-0">
            <p className="text-base text-black truncate">{view.name}</p>
            <span className="mt-1 inline-block text-[10px] lowercase tracking-wide text-black/55 px-1.5 py-0.5 rounded border border-black/15">
              {view.assetSymbol}
            </span>
          </div>
        </div>
        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="text-black/40 group-hover:text-black transition shrink-0"
        />
      </div>

      <Sparkline
        values={history}
        className={`h-9 w-full ${trendLineTone(priceUp)}`}
      />

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <LiveAmount value={value} apy={view.apy} variant="md" />
          {/* How much you own, not only what it's worth. The list rows say this;
              the cards didn't, so switching layout lost the number. */}
          {isPrice && view.heldDecimals !== undefined && view.shares > BigInt(0) ? (
            <p className="text-[11px] tabular-nums text-[#3c05c7]/80">
              {floorTo(Number(view.shares) / 10 ** view.heldDecimals, 6)} {unitLabelOf(view)}
            </p>
          ) : (
            <p className="text-[10px] lowercase tracking-wide text-black/40">
              {value > 0 ? "your position" : "tap to deposit"}
            </p>
          )}
          {/* Which of your holdings is actually down — the same line the list rows
              carry, so switching layout doesn't lose the answer. */}
          {typeof earned === "number" && Math.abs(earned) >= 0.005 && (
            <p className={`text-[11px] tabular-nums ${earned >= 0 ? "text-black/40" : "text-red-600"}`}>
              {earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)} {t("position.sinceBuy")}
            </p>
          )}
        </div>
        {isPrice && typeof change24h === "number" ? (
          <p
            className={`text-xs tabular-nums shrink-0 ${
              trendTextTone(priceUp)
            }`}
          >
            {priceUp ? "+" : ""}
            {change24h.toFixed(2)}% 24h
          </p>
        ) : (
          <p
            className={`text-xs tabular-nums shrink-0 ${
              RISK_TONE[view.riskLevel] ?? "text-black/45"
            }`}
          >
            {(view.apy * 100).toFixed(2)}% APY
          </p>
        )}
      </div>
    </button>
  );
}
