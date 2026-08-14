"use client";

import { ArrowUpRight, Check } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { useApyHistory } from "@/hooks/use-apy-history";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { RISK_TONE, fromBaseUnits, unitLabelOf } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { Sparkline } from "@/components/sparkline";
import { trendUp, trendLineTone, trendTextTone } from "@/lib/yield/trend";
import { floorTo, formatUsdAmount } from "@oxar/sdk";
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
  /** What was put in, same basis — turns "worth $10.22" into "worth $10.22, from $10.05". */
  invested?: number;
}

/** Grid ("квадратик") card for one source — APY trend for yield, price trend
 *  + 24h change for price-exposure assets (stocks/gold). */
export function PositionCard({ view, onOpen, change24h, earned, invested, picked, onTogglePick }: Props) {
  const { t } = useT();
  const value = fromBaseUnits(view.underlyingBalance, view.decimals);
  const apyHistory = useApyHistory(view.defiLlamaPoolId);
  const charts = useStockCharts();

  const isPrice = isPriceExposure(view.id);
  const history = isPrice ? (view.heldMint ? charts[view.heldMint] ?? [] : []) : apyHistory;
  // Price assets know their direction from the 24h move; a yield source reads it
  // off the series it draws.
  const priceUp = isPrice ? (change24h ?? 0) >= 0 : trendUp(history);
  // Units held, when the asset is something you own by the piece.
  const units =
    isPrice && view.heldDecimals !== undefined
      ? Number(view.shares) / 10 ** view.heldDecimals
      : 0;

  return (
    <button
      onClick={onOpen}
      className={`group relative isolate flex flex-col gap-4 overflow-hidden rounded-[8px] border bg-paper p-5 text-left transition ${
        picked ? "border-ink/40 ring-1 ring-ink/10" : "border-ink/10 hover:border-ink/30"
      }`}
    >
      <BanknoteBg seed={view.id} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <AssetIcon src={assetLogoSrc(view.id)} label={assetIconLabel(view.id, view.assetSymbol)} size={32} />
          <div className="min-w-0">
            <p className="text-base text-ink truncate">{view.name}</p>
            <span className="mt-1 inline-block text-[10px] lowercase tracking-wide text-ink/55 px-1.5 py-0.5 rounded border border-ink/15">
              {view.assetSymbol}
            </span>
          </div>
        </div>
        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="shrink-0 text-ink/40 transition group-hover:text-ink"
        />
      </div>

      {/* A fixed slot: an asset with no series left a hole where its neighbour had a
          chart, and the two cards then disagreed about where everything below sits. */}
      <div className="h-9">
        <Sparkline values={history} className={`h-9 w-full ${trendLineTone(priceUp)}`} />
      </div>

      <div className="flex min-h-[62px] items-end justify-between gap-2">
        <div className="min-w-0">
          <LiveAmount value={value} apy={view.apy} variant="md" />
          {/* How much you own, not only what it's worth. The list rows say this;
              the cards didn't, so switching layout lost the number. */}
          {isPrice && view.heldDecimals !== undefined && view.shares > BigInt(0) ? (
            <p className="text-[11px] tabular-nums text-[var(--brand)]/80">
              {floorTo(Number(view.shares) / 10 ** view.heldDecimals, 6)} {unitLabelOf(view)}
            </p>
          ) : (
            <p className="text-[10px] lowercase tracking-wide text-ink/40">
              {value > 0 ? "your position" : "tap to deposit"}
            </p>
          )}
          {/* Which of your holdings is actually down — the same line the list rows
              carry, so switching layout doesn't lose the answer. */}
          {typeof earned === "number" && (
            <p className={`text-[11px] tabular-nums ${earned >= 0 ? "text-ink/40" : "text-loss"}`}>
              {earned >= 0 ? "+" : "−"}${formatUsdAmount(Math.abs(earned))} {t("position.sinceBuy")}
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
              RISK_TONE[view.riskLevel] ?? "text-ink/45"
            }`}
          >
            {(view.apy * 100).toFixed(2)}% APY
          </p>
        )}
      </div>

      {/* Worth compared to what, and bought at what price. Two facts a holding is
          judged by, and neither was on the card — only the current value, which
          says nothing on its own. Shown when the cost basis is known and the unit
          count is real; a made-up average is worse than none. */}
      {invested !== undefined && invested > 0 && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink/[0.06] pt-3 text-[11px] tabular-nums text-ink/40">
          <span>
            {t("position.invested")} ${invested.toFixed(2)}
          </span>
          {units > 0 && (
            <span>
              {t("position.avgEntry")} ${floorTo(invested / units, 6)}
            </span>
          )}
        </div>
      )}

      {/* The card's one action, along its bottom edge — it used to sit in the top
          line, where it crowded the name and the arrow. */}
      {onTogglePick && (
        <PickButton block className="mt-auto" picked={!!picked} onToggle={onTogglePick} label={view.name} />
      )}
    </button>
  );
}
