"use client";

import { ArrowUpRight } from "lucide-react";

import { PickButton } from "@/components/pick-button";
import { usePickSet } from "@/components/pick-set";
import { pickTarget, type ProviderGroup } from "@/lib/yield";
import { RISK_TONE, RISK_LABEL, fromBaseUnits } from "@/lib/yield";
import { useApyHistory } from "@/hooks/use-apy-history";
import { Sparkline } from "@/components/sparkline";
import { trendUp, trendLineTone } from "@/lib/yield/trend";
import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { assetLogoSrc } from "@/lib/yield/asset-logo";
import { TrustLine } from "@/components/trust-line";

interface Props {
  group: ProviderGroup;
  onOpen: () => void;
}

/** Grid ("квадратик") card for a marketplace source — one provider or a group. */
export function SourceCard({ group, onOpen }: Props) {
  const pickSet = usePickSet();
  const top = pickTarget(group);
  const history = useApyHistory(top.defiLlamaPoolId);
  const up = trendUp(history);
  const positionTotal = group.views.reduce(
    (sum, v) => sum + fromBaseUnits(v.underlyingBalance, v.decimals),
    0,
  );
  const grouped = group.views.length > 1;

  return (
    <button
      onClick={onOpen}
      className="group relative isolate overflow-hidden flex flex-col gap-4 p-5 rounded-[8px] border border-ink/10 bg-paper hover:border-ink/30 transition text-left"
    >
      <BanknoteBg seed={group.views[0]?.id ?? group.name} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <AssetIcon src={assetLogoSrc(group.views[0]?.id ?? "")} label={group.name} size={32} />
          <div className="min-w-0">
          <p className="text-base text-ink truncate">{group.name}</p>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            {group.views.map((v) => (
              <span
                key={v.id}
                className="text-[10px] lowercase tracking-wide text-ink/55 px-1.5 py-0.5 rounded border border-ink/15"
              >
                {v.assetSymbol}
              </span>
            ))}
          </div>
          <TrustLine poolId={top.defiLlamaPoolId} sourceId={top.id} />
          </div>
        </div>
        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="text-ink/40 group-hover:text-ink transition shrink-0"
        />
      </div>

      <Sparkline values={history} className={`h-9 w-full ${trendLineTone(up)}`} />

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xl text-ink tabular-nums">
            {grouped ? "up to " : ""}
            {(group.maxApy * 100).toFixed(2)}%
          </p>
          <p className="text-[10px] lowercase tracking-wide text-ink/40">
            {positionTotal > 0 ? `$${positionTotal.toFixed(2)} in` : "APY"}
          </p>
        </div>
        <p
          className={`text-[10px] lowercase tracking-wide shrink-0 ${
            RISK_TONE[top.riskLevel] ?? "text-ink/45"
          }`}
        >
          {RISK_LABEL[top.riskLevel] ?? top.riskLevel}
        </p>
      </div>

      {/* Along the bottom edge, the width of the card. In the corner it was a chip
          competing with the name and the arrow for the same top line; here it reads
          as the card's one action. */}
      {pickSet?.enabled && (
        <PickButton
          block
          className="mt-auto"
          picked={pickSet.picked.has(top.id)}
          onToggle={() => pickSet.toggle(top.id)}
          label={top.name}
        />
      )}
    </button>
  );
}
