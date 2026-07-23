"use client";

import { ArrowUpRight } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { useApyHistory } from "@/hooks/use-apy-history";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { RISK_TONE, fromBaseUnits } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { Sparkline } from "@/components/sparkline";
import { LiveAmount } from "@/components/live-amount";
import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";

interface Props {
  view: ProviderView;
  onOpen: () => void;
  /** 24h price change (%) for price-exposure assets — shown instead of APY. */
  change24h?: number;
}

/** Grid ("квадратик") card for one source — APY trend for yield, price trend
 *  + 24h change for price-exposure assets (stocks/gold). */
export function PositionCard({ view, onOpen, change24h }: Props) {
  const value = fromBaseUnits(view.underlyingBalance, view.decimals);
  const apyHistory = useApyHistory(view.defiLlamaPoolId);
  const charts = useStockCharts();

  const isPrice = isPriceExposure(view.id);
  const priceUp = (change24h ?? 0) >= 0;
  const history = isPrice ? (view.heldMint ? charts[view.heldMint] ?? [] : []) : apyHistory;

  return (
    <button
      onClick={onOpen}
      className="group relative isolate overflow-hidden flex flex-col gap-4 p-5 rounded-[8px] border border-black/10 hover:border-black/30 transition text-left"
    >
      <BanknoteBg seed={view.id} />
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
        className={`w-full h-9 ${
          isPrice ? (priceUp ? "text-emerald-400/50" : "text-red-400/50") : "text-[#3c05c7]/60"
        }`}
      />

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <LiveAmount value={value} apy={view.apy} variant="md" />
          <p className="text-[10px] lowercase tracking-wide text-black/40">
            {value > 0 ? "your position" : "tap to deposit"}
          </p>
        </div>
        {isPrice && typeof change24h === "number" ? (
          <p
            className={`text-xs tabular-nums shrink-0 ${
              priceUp ? "text-emerald-600" : "text-red-600"
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
