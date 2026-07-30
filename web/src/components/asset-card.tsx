"use client";

import { Sparkline } from "@/components/sparkline";
import { trendLineTone, trendTextTone } from "@/lib/yield/trend";
import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { assetLogoSrc } from "@/lib/yield/asset-logo";
import { PickButton } from "@/components/pick-button";
import type { AssetMeta } from "@/lib/yield/assets";

interface Props {
  asset: AssetMeta;
  layout: "list" | "grid";
  /** Has a live provider (openable) — a card without one is a dimmed placeholder. */
  openable: boolean;
  price?: { price: number; change24h: number };
  chart?: number[];
  holdings: number;
  earned?: number;
  /** Multi-pick control — omitted entirely (not just hidden) when the feature's off. */
  showPick: boolean;
  picked: boolean;
  onTogglePick: () => void;
  onOpen: () => void;
}

/** One buy/sell card, list or grid — extracted from `AssetSection` to keep that
 *  file focused on filtering/paging rather than card markup. */
export function AssetCard({
  asset,
  layout,
  openable,
  price,
  chart,
  holdings,
  earned,
  showPick,
  picked,
  onTogglePick,
  onOpen,
}: Props) {
  const up = (price?.change24h ?? 0) >= 0;
  const spark =
    chart && chart.length > 1 ? (
      <Sparkline values={chart} height={32} className={`h-8 w-full ${trendLineTone(up)}`} />
    ) : null;

  const priceEl = (
    <p className="text-lg text-black tabular-nums">
      {price ? `$${price.price.toFixed(2)}` : "—"}
    </p>
  );
  const changeEl = price ? (
    <p className={`mt-0.5 text-xs tabular-nums ${trendTextTone(up)}`}>
      {up ? "+" : ""}
      {price.change24h.toFixed(2)}% 24h
    </p>
  ) : null;
  const ownedEl = holdings > 0 ? (
    <p className="mt-1 text-[11px] text-[#3c05c7]/80 tabular-nums">
      you own ${holdings.toFixed(2)}
      {typeof earned === "number" && (
        <span className={earned >= 0 ? "text-emerald-400/70" : "text-red-400/70"}>
          {" · "}
          {earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)}
        </span>
      )}
    </p>
  ) : null;
  const pick = showPick ? (
    <PickButton picked={picked} onToggle={onTogglePick} label={asset.name} />
  ) : null;
  const head = (
    <div className="flex items-center gap-3 min-w-0">
      <AssetIcon src={assetLogoSrc(asset.id)} label={asset.symbol || asset.token} size={36} />
      <div className="min-w-0">
        <p className="text-base text-black">{asset.token}</p>
        <p className="mt-0.5 text-xs text-black/45 truncate">{asset.name}</p>
      </div>
    </div>
  );

  if (layout === "grid") {
    return (
      <button
        type="button"
        disabled={!openable}
        onClick={() => openable && onOpen()}
        className="group relative isolate overflow-hidden p-5 rounded-[8px] border border-black/10 bg-white hover:border-black/30 transition-colors text-left disabled:opacity-50 min-h-[120px] flex flex-col justify-between"
      >
        <BanknoteBg seed={asset.id} />
        {pick && <span className="absolute right-3 top-3 z-10">{pick}</span>}
        {head}
        {spark && <div className="my-2">{spark}</div>}
        <div className={spark ? "mt-1" : "mt-3"}>
          {priceEl}
          {changeEl}
          {ownedEl}
        </div>
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={!openable}
      onClick={() => openable && onOpen()}
      className="group relative isolate flex w-full items-center gap-3 overflow-hidden rounded-[8px] border border-black/10 bg-white p-5 text-left transition-colors hover:border-black/30 disabled:opacity-50"
    >
      <BanknoteBg seed={asset.id} />
      <div className="min-w-0 flex-1">
        {head}
        {ownedEl}
      </div>
      {/* Fixed-width columns so the charts and the figures line up down the list
          instead of drifting with the width of the text beside them. The slots are
          rendered even when empty, or a row without a chart would shift. */}
      <div className="hidden w-[140px] shrink-0 sm:block">{spark}</div>
      {/* Price first, then the control: the number is what the row is read for,
          and a button between the chart and the price split them apart. */}
      <div className="w-[112px] shrink-0 text-right">
        {priceEl}
        {changeEl}
      </div>
      {pick && <span className="shrink-0">{pick}</span>}
    </button>
  );
}
