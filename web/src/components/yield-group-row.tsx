"use client";

import { PickButton } from "@/components/pick-button";
import { usePickSet } from "@/components/pick-set";
import { pickTarget, type ProviderGroup } from "@/lib/yield";
import { RISK_TONE, RISK_LABEL, fromBaseUnits, unitLabelOf } from "@/lib/yield";
import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc } from "@/lib/yield/asset-logo";
import { Sparkline } from "@/components/sparkline";
import { trendUp, trendLineTone } from "@/lib/yield/trend";
import { MarketRow } from "@/components/market-row";
import { TrustLine } from "@/components/trust-line";
import { useApyHistory } from "@/hooks/use-apy-history";

interface Props {
  group: ProviderGroup;
  onOpen: () => void;
}

/**
 * One marketplace row for a collapsed protocol (e.g. Jupiter Lend USDC/USDT).
 * Shows the asset chips + "up to" the best APY; opening it reveals the asset picker.
 *
 * Same shape as the single-provider and stock rows — see `YieldProviderRow`.
 *
 * Picking one adds the source behind the headline rate. That isn't a guess: the row
 * already promises "up to X%", and X comes from exactly that source — so adding it is
 * what the row says it does. The allocation sheet then lists it by its full name
 * before anything is signed, so the choice is visible and undoable. Wanting the other
 * currency is still one tap away: opening the group shows each on its own.
 */
export function YieldGroupRow({ group, onOpen }: Props) {
  const pickSet = usePickSet();
  const top = pickTarget(group);
  const history = useApyHistory(top.defiLlamaPoolId);
  const up = trendUp(history);
  const positionTotal = group.views.reduce(
    (sum, v) => sum + fromBaseUnits(v.underlyingBalance, v.decimals),
    0,
  );

  return (
    <MarketRow
      seed={group.views[0]?.id ?? group.name}
      onOpen={onOpen}
      lead={
        <>
          <div className="flex items-center gap-3">
            <AssetIcon src={assetLogoSrc(group.views[0]?.id ?? "")} label={group.name} size={36} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="truncate text-base text-black">{group.name}</p>
                <span className="text-[10px] lowercase tracking-wide text-emerald-600">● live</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {group.views.map((v) => (
                  <span
                    key={v.id}
                    className="rounded border border-black/15 px-1.5 py-0.5 text-[10px] lowercase tracking-wide text-black/55"
                  >
                    {unitLabelOf(v)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {positionTotal > 0 && (
            <p className="mt-1 text-[11px] tabular-nums text-[#3c05c7]/80">
              you own ${positionTotal.toFixed(2)}
            </p>
          )}
          <TrustLine poolId={top.defiLlamaPoolId} sourceId={top.id} />
        </>
      }
      chart={
        history.length > 1 ? (
          <Sparkline values={history} height={32} className={`h-8 w-full ${trendLineTone(up)}`} />
        ) : null
      }
      figure={
        <>
          {/* "up to" is set small so the RATE lines up with the plain rates above and
              below it, rather than pushing the whole figure left. */}
          <p className="text-xl tabular-nums text-black">
            <span className="text-[11px] lowercase tracking-wide text-black/40">up to </span>
            {(group.maxApy * 100).toFixed(2)}%
          </p>
          <p className={`text-[10px] lowercase tracking-wide ${RISK_TONE[top.riskLevel] ?? "text-black/55"}`}>
            {RISK_LABEL[top.riskLevel] ?? top.riskLevel}
          </p>
        </>
      }
      pick={
        pickSet?.enabled ? (
          <PickButton
            block
            picked={pickSet.picked.has(top.id)}
            onToggle={() => pickSet.toggle(top.id)}
            label={top.name}
          />
        ) : null
      }
    />
  );
}
