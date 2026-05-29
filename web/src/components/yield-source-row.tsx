"use client";

import type { YieldSourceConfig } from "@oxar/sdk";
import { CHAIN_LABEL, RISK_TONE, RISK_LABEL } from "@/lib/yield";

interface Props {
  source: YieldSourceConfig;
}

/**
 * Roadmap row — a yield source not yet integrated as a live provider.
 * Display-only (not openable); live sources render via YieldProviderRow.
 */
export function YieldSourceRow({ source }: Props) {
  return (
    <div className="w-full text-left p-5 rounded-[8px] border border-white/5 opacity-60">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="font-sans text-base text-white truncate">
              {source.name}
            </p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
              {CHAIN_LABEL[source.chain] ?? source.chain}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
              · soon
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-white/40 truncate">
            {source.description}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-sans text-xl text-white tabular-nums">
            {source.baseApy.toFixed(1)}%
          </p>
          <p
            className={`font-mono text-[10px] uppercase tracking-wide ${
              RISK_TONE[source.riskLevel] ?? "text-white/50"
            }`}
          >
            {RISK_LABEL[source.riskLevel] ?? source.riskLevel}
          </p>
        </div>
      </div>
    </div>
  );
}
