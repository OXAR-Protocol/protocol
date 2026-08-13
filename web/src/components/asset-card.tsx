"use client";

import { Sparkline } from "@/components/sparkline";
import { trendLineTone, trendTextTone } from "@/lib/yield/trend";
import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { MarketRow } from "@/components/market-row";
import { TrustLine } from "@/components/trust-line";
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
  // One shape everywhere: full width along the bottom, card or row. The row gains a
  // little height for it and keeps its line, which beside the figure it was losing.
  const pick = showPick ? (
    <PickButton block picked={picked} onToggle={onTogglePick} label={asset.name} />
  ) : null;
  const head = (
    <div className="flex items-center gap-3 min-w-0">
      <AssetIcon src={assetLogoSrc(asset.id)} label={asset.symbol || asset.token} size={36} />
      <div className="min-w-0">
        {/* Truncate, don't spill: without this a ticker in a squeezed column ran
            out from under itself and printed over the price beside it. */}
        <p className="truncate text-base text-black">{asset.token}</p>
        <p className="mt-0.5 truncate text-xs text-black/45">{asset.name}</p>
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
        <div className="min-w-0">{head}</div>
        {spark && <div className="my-2">{spark}</div>}
        <div className={spark ? "mt-1" : "mt-3"}>
          {priceEl}
          {changeEl}
          {ownedEl}
          <TrustLine sourceId={asset.id} />
        </div>
        {pick && <div className="mt-3">{pick}</div>}
      </button>
    );
  }
  return (
    <MarketRow
      seed={asset.id}
      onOpen={() => openable && onOpen()}
      disabled={!openable}
      lead={
        <>
          {head}
          {ownedEl}
          {/* No pool figure for a swap-held stock — the issuer is the fact that
              applies. See the note in TrustLine. */}
          <TrustLine sourceId={asset.id} />
        </>
      }
      chart={spark}
      // Price first, then the control: the number is what the row is read for,
      // and a button between the chart and the price split them apart.
      figure={
        <>
          {priceEl}
          {changeEl}
        </>
      }
      pick={pick}
    />
  );
}
