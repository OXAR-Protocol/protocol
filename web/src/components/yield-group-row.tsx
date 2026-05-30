"use client";

import { ArrowUpRight } from "lucide-react";

import type { ProviderGroup } from "@/lib/yield";
import { RISK_TONE, RISK_LABEL, fromBaseUnits } from "@/lib/yield";

interface Props {
  group: ProviderGroup;
  onOpen: () => void;
}

/**
 * One marketplace card for a collapsed protocol (e.g. Jupiter Lend USDC/USDT/USDG).
 * Shows the asset chips + "up to" the best APY; opening it reveals the asset picker.
 */
export function YieldGroupRow({ group, onOpen }: Props) {
  const top = group.views.reduce((a, b) => (b.apy > a.apy ? b : a), group.views[0]);
  const positionTotal = group.views.reduce(
    (sum, v) => sum + fromBaseUnits(v.underlyingBalance, v.decimals),
    0,
  );

  return (
    <button
      onClick={onOpen}
      className="group w-full text-left p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition"
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-sans text-base text-white truncate">{group.name}</p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-emerald-300/70">
              ● live
            </span>
            {positionTotal > 0 && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
                · you&apos;re in
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {group.views.map((v) => (
              <span
                key={v.id}
                className="font-mono text-[10px] uppercase tracking-wide text-white/50 px-1.5 py-0.5 rounded border border-white/15"
              >
                {v.assetSymbol}
              </span>
            ))}
          </div>
          {positionTotal > 0 && (
            <p className="mt-2 font-mono text-[11px] text-white/50">
              your position: ${positionTotal.toFixed(2)}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="font-sans text-xl text-white tabular-nums">
            up to {(group.maxApy * 100).toFixed(2)}%
          </p>
          <p
            className={`font-mono text-[10px] uppercase tracking-wide ${
              RISK_TONE[top.riskLevel] ?? "text-white/50"
            }`}
          >
            {RISK_LABEL[top.riskLevel] ?? top.riskLevel}
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
