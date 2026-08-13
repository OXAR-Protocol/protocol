"use client";

import { PickButton } from "@/components/pick-button";
import { usePickSet } from "@/components/pick-set";
import { Sparkline } from "@/components/sparkline";
import { trendUp, trendLineTone } from "@/lib/yield/trend";
import { MarketRow } from "@/components/market-row";
import { TrustLine } from "@/components/trust-line";
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
  const up = trendUp(history);
  const positionValue = fromBaseUnits(view.underlyingBalance, view.decimals);
  const inPosition = positionValue > 0;

  return (
    <MarketRow
      seed={view.id}
      onOpen={onOpen}
      lead={
        <>
          <div className="flex items-center gap-3">
            <AssetIcon src={assetLogoSrc(view.id)} label={assetIconLabel(view.id, view.assetSymbol)} size={36} />
            <div className="min-w-0">
              {/* Wraps rather than overflows: on a phone the chip and the "live"
                  dot had nowhere to go and printed over the rate. */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="truncate text-base text-black">{view.name}</p>
                <span className="rounded border border-black/15 px-1.5 py-0.5 text-[10px] lowercase tracking-wide text-black/60">
                  {view.assetSymbol}
                </span>
                <span className="text-[10px] lowercase tracking-wide text-emerald-600">● live</span>
              </div>
            </div>
          </div>
          {inPosition && (
            <p className="mt-1 text-[11px] tabular-nums text-[#3c05c7]/80">
              you own ${positionValue.toFixed(2)}
            </p>
          )}
          <TrustLine poolId={view.defiLlamaPoolId} sourceId={view.id} />
        </>
      }
      chart={
        history.length > 1 ? (
          <Sparkline values={history} height={32} className={`h-8 w-full ${trendLineTone(up)}`} />
        ) : null
      }
      figure={
        <>
          <p className="text-xl tabular-nums text-black">{(view.apy * 100).toFixed(2)}%</p>
          <p className={`text-[10px] lowercase tracking-wide ${RISK_TONE[view.riskLevel] ?? "text-black/55"}`}>
            {RISK_LABEL[view.riskLevel] ?? view.riskLevel}
          </p>
        </>
      }
      pick={
        pickSet?.enabled ? (
          <PickButton
            block
            picked={pickSet.picked.has(view.id)}
            onToggle={() => pickSet.toggle(view.id)}
            label={view.name}
          />
        ) : null
      }
    />
  );
}
