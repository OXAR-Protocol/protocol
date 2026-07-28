"use client";

import { PickButton } from "@/components/pick-button";
import { usePickSet } from "@/components/pick-set";
import { Sparkline } from "@/components/sparkline";
import { BanknoteBg } from "@/components/banknote-bg";
import { useApyHistory } from "@/hooks/use-apy-history";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { RISK_TONE, RISK_LABEL, fromBaseUnits } from "@/lib/yield";
import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";

interface Props {
  view: ProviderView;
  onOpen: () => void;
}

/**
 * Live, openable marketplace row backed by a real yield provider.
 *
 * Deliberately the same shape as a stock row: name on the left, trend in a fixed
 * slot, the figure on the right, the pick control last. A thing you can buy should
 * not look like a different species depending on which section it sits in — and the
 * fixed-width trend slot is what keeps the charts on one vertical line, instead of
 * sliding about with the width of the text beside them.
 */
export function YieldProviderRow({ view, onOpen }: Props) {
  const pickSet = usePickSet();
  const history = useApyHistory(view.defiLlamaPoolId);
  const positionValue = fromBaseUnits(view.underlyingBalance, view.decimals);
  const inPosition = positionValue > 0;

  return (
    <button
      onClick={onOpen}
      className="group relative isolate flex w-full items-center justify-between overflow-hidden rounded-[8px] border border-black/10 bg-white p-5 text-left transition-colors hover:border-black/30"
    >
      <BanknoteBg seed={view.id} />

      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <AssetIcon src={assetLogoSrc(view.id)} label={assetIconLabel(view.id, view.assetSymbol)} size={36} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="truncate text-base text-black">{view.name}</p>
              <span className="rounded border border-black/15 px-1.5 py-0.5 text-[10px] lowercase tracking-wide text-black/60">
                {view.assetSymbol}
              </span>
              <span className="text-[10px] lowercase tracking-wide text-emerald-600">● live</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-black/45">{view.description}</p>
          </div>
        </div>
        {inPosition && (
          <p className="mt-1 text-[11px] tabular-nums text-[#3c05c7]/80">
            you own ${positionValue.toFixed(2)}
          </p>
        )}
      </div>

      {history.length > 1 && (
        <div className="mx-4 hidden max-w-[140px] flex-1 sm:block">
          <Sparkline values={history} height={32} className="h-8 w-full text-[#3c05c7]/40" />
        </div>
      )}

      <div className="ml-3 text-right">
        <p className="text-xl tabular-nums text-black">{(view.apy * 100).toFixed(2)}%</p>
        <p className={`text-[10px] lowercase tracking-wide ${RISK_TONE[view.riskLevel] ?? "text-black/55"}`}>
          {RISK_LABEL[view.riskLevel] ?? view.riskLevel}
        </p>
      </div>

      {pickSet?.enabled && (
        <span className="ml-3">
          <PickButton
            picked={pickSet.picked.has(view.id)}
            onToggle={() => pickSet.toggle(view.id)}
            label={view.name}
          />
        </span>
      )}
    </button>
  );
}
