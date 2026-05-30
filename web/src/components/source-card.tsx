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
      className="group flex flex-col gap-4 p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-sans text-base text-white truncate">{group.name}</p>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            {group.views.map((v) => (
              <span
                key={v.id}
                className="font-mono text-[10px] uppercase tracking-wide text-white/50 px-1.5 py-0.5 rounded border border-white/15"
              >
                {v.assetSymbol}
              </span>
            ))}
          </div>
        </div>
        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="text-white/30 group-hover:text-white transition shrink-0"
        />
      </div>

      <Sparkline values={history} className="w-full h-9 text-accent/60" />

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="font-sans text-xl text-white tabular-nums">
            {grouped ? "up to " : ""}
            {(group.maxApy * 100).toFixed(2)}%
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">
            {positionTotal > 0 ? `$${positionTotal.toFixed(2)} in` : "APY"}
          </p>
        </div>
        <p
          className={`font-mono text-[10px] uppercase tracking-wide shrink-0 ${
            RISK_TONE[top.riskLevel] ?? "text-white/40"
          }`}
        >
          {RISK_LABEL[top.riskLevel] ?? top.riskLevel}
        </p>
      </div>
    </button>
  );
}
