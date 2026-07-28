"use client";

import { ArrowUpRight } from "lucide-react";

import { PickButton } from "@/components/pick-button";
import { usePickSet } from "@/components/pick-set";
import { Sparkline } from "@/components/sparkline";
import { useApyHistory } from "@/hooks/use-apy-history";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { RISK_TONE, RISK_LABEL, fromBaseUnits } from "@/lib/yield";
import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";

interface Props {
  view: ProviderView;
  onOpen: () => void;
}

/** Live, openable marketplace row backed by a real yield provider. */
export function YieldProviderRow({ view, onOpen }: Props) {
  const pickSet = usePickSet();
  // The grid card has always drawn this; the list row didn't, so switching layout
  // lost the trend for yield sources while the stock rows kept theirs.
  const history = useApyHistory(view.defiLlamaPoolId);
  const positionValue = fromBaseUnits(view.underlyingBalance, view.decimals);
  const inPosition = positionValue > 0;

  return (
    <button
      onClick={onOpen}
      className="group w-full text-left p-5 rounded-[8px] border border-black/10 bg-white hover:border-black/30 transition"
    >
      <div className="flex items-center gap-4">
        <AssetIcon src={assetLogoSrc(view.id)} label={assetIconLabel(view.id, view.assetSymbol)} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-base text-black truncate">{view.name}</p>
            <span className="text-[10px] lowercase tracking-wide text-black/60 px-1.5 py-0.5 rounded border border-black/15">
              {view.assetSymbol}
            </span>
            <span className="text-[10px] lowercase tracking-wide text-emerald-600">
              ● live
            </span>
            {inPosition && (
              <span className="text-[10px] lowercase tracking-wide text-[#3c05c7]">
                · you're in
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-black/45 truncate">
            {view.description}
          </p>
          {inPosition && (
            <p className="mt-2 text-[11px] text-black/55">
              your position: ${positionValue.toFixed(2)}
            </p>
          )}
        </div>

        {history.length > 1 && (
          <div className="mx-4 hidden max-w-[140px] flex-1 sm:block">
            <Sparkline values={history} className="h-8 w-full text-[#3c05c7]/60" />
          </div>
        )}

        <div className="text-right shrink-0">
          <p className="text-xl text-black tabular-nums">
            {(view.apy * 100).toFixed(2)}%
          </p>
          <p
            className={`text-[10px] lowercase tracking-wide ${
              RISK_TONE[view.riskLevel] ?? "text-black/55"
            }`}
          >
            {RISK_LABEL[view.riskLevel] ?? view.riskLevel}
          </p>
        </div>

        {pickSet?.enabled && (
          <PickButton
            picked={pickSet.picked.has(view.id)}
            onToggle={() => pickSet.toggle(view.id)}
            label={view.name}
          />
        )}

        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="text-black/40 group-hover:text-black transition shrink-0"
        />
      </div>
    </button>
  );
}
