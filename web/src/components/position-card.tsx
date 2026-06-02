"use client";

import { ArrowUpRight } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { useApyHistory } from "@/hooks/use-apy-history";
import { RISK_TONE, fromBaseUnits } from "@/lib/yield";
import { Sparkline } from "@/components/sparkline";
import { LiveAmount } from "@/components/live-amount";

interface Props {
  view: ProviderView;
  onOpen: () => void;
}

/** Grid ("квадратик") card for one source — with a real APY history sparkline. */
export function PositionCard({ view, onOpen }: Props) {
  const value = fromBaseUnits(view.underlyingBalance, view.decimals);
  const history = useApyHistory(view.defiLlamaPoolId);

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-4 p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-sans text-base text-white truncate">{view.name}</p>
          <span className="mt-1 inline-block font-mono text-[10px] uppercase tracking-wide text-white/50 px-1.5 py-0.5 rounded border border-white/15">
            {view.assetSymbol}
          </span>
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
          <LiveAmount value={value} apy={view.apy} variant="md" />
          <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">
            {value > 0 ? "your position" : "tap to deposit"}
          </p>
        </div>
        <p
          className={`font-mono text-xs tabular-nums shrink-0 ${
            RISK_TONE[view.riskLevel] ?? "text-white/40"
          }`}
        >
          {(view.apy * 100).toFixed(2)}% APY
        </p>
      </div>
    </button>
  );
}
