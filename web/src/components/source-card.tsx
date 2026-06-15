"use client";

import { ArrowUpRight } from "lucide-react";

import type { ProviderGroup } from "@/lib/yield";
import { RISK_TONE, RISK_LABEL, fromBaseUnits } from "@/lib/yield";
import { useApyHistory } from "@/hooks/use-apy-history";
import { Sparkline } from "@/components/sparkline";

interface Props {
  group: ProviderGroup;
  onOpen: () => void;
}

/** Grid ("квадратик") card for a marketplace source — one provider or a group. */
export function SourceCard({ group, onOpen }: Props) {
  const top = group.views.reduce((a, b) => (b.apy > a.apy ? b : a), group.views[0]);
  const history = useApyHistory(top.defiLlamaPoolId);
  const positionTotal = group.views.reduce(
    (sum, v) => sum + fromBaseUnits(v.underlyingBalance, v.decimals),
    0,
  );
  const grouped = group.views.length > 1;

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-4 p-5 rounded-[8px] border border-black/10 hover:border-black/30 transition text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base text-black truncate">{group.name}</p>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            {group.views.map((v) => (
              <span
                key={v.id}
                className="text-[10px] uppercase tracking-wide text-black/55 px-1.5 py-0.5 rounded border border-black/15"
              >
                {v.assetSymbol}
              </span>
            ))}
          </div>
        </div>
        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="text-black/40 group-hover:text-black transition shrink-0"
        />
      </div>

      <Sparkline values={history} className="w-full h-9 text-[#3c05c7]/60" />

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xl text-black tabular-nums">
            {grouped ? "up to " : ""}
            {(group.maxApy * 100).toFixed(2)}%
          </p>
          <p className="text-[10px] uppercase tracking-wide text-black/40">
            {positionTotal > 0 ? `$${positionTotal.toFixed(2)} in` : "APY"}
          </p>
        </div>
        <p
          className={`text-[10px] uppercase tracking-wide shrink-0 ${
            RISK_TONE[top.riskLevel] ?? "text-black/45"
          }`}
        >
          {RISK_LABEL[top.riskLevel] ?? top.riskLevel}
        </p>
      </div>
    </button>
  );
}
