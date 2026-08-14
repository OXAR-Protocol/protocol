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
    <div className="w-full text-left p-5 rounded-[8px] border border-ink/5 opacity-60">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-base text-ink truncate">
              {source.name}
            </p>
            <span className="text-[10px] lowercase tracking-wide text-ink/40">
              {CHAIN_LABEL[source.chain] ?? source.chain}
            </span>
            <span className="text-[10px] lowercase tracking-wide text-ink/40">
              · soon
            </span>
          </div>
          <p className="mt-1 text-xs text-ink/45 truncate">
            {source.description}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl text-ink tabular-nums">
            {source.apyLabel ?? `${source.baseApy.toFixed(1)}%`}
          </p>
          <p
            className={`text-[10px] lowercase tracking-wide ${
              RISK_TONE[source.riskLevel] ?? "text-ink/55"
            }`}
          >
            {RISK_LABEL[source.riskLevel] ?? source.riskLevel}
          </p>
        </div>
      </div>
    </div>
  );
}
