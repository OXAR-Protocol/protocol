"use client";

import { ArrowUpRight } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { RISK_TONE, RISK_LABEL, fromBaseUnits } from "@/lib/yield";

interface Props {
  view: ProviderView;
  onOpen: () => void;
}

/** Live, openable marketplace row backed by a real yield provider. */
export function YieldProviderRow({ view, onOpen }: Props) {
  const positionValue = fromBaseUnits(view.underlyingBalance, view.decimals);
  const inPosition = positionValue > 0;

  return (
    <button
      onClick={onOpen}
      className="group w-full text-left p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition"
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="font-sans text-base text-white truncate">{view.name}</p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-300/70">
              ● live
            </span>
            {inPosition && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
                · you're in
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-xs text-white/40 truncate">
            {view.description}
          </p>
          {inPosition && (
            <p className="mt-2 font-mono text-[11px] text-white/50">
              your position: ${positionValue.toFixed(2)}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="font-sans text-xl text-white tabular-nums">
            {(view.apy * 100).toFixed(2)}%
          </p>
          <p
            className={`font-mono text-[10px] uppercase tracking-wide ${
              RISK_TONE[view.riskLevel] ?? "text-white/50"
            }`}
          >
            {RISK_LABEL[view.riskLevel] ?? view.riskLevel}
          </p>
        </div>

        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="text-white/30 group-hover:text-white transition shrink-0"
        />
      </div>
    </button>
  );
}
