"use client";

import { ArrowUpRight } from "lucide-react";

import type { ProviderGroup } from "@/lib/yield";
import { RISK_TONE, RISK_LABEL, fromBaseUnits } from "@/lib/yield";
import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc } from "@/lib/yield/asset-logo";

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
      className="group w-full text-left p-5 rounded-[8px] border border-black/10 hover:border-black/30 transition"
    >
      <div className="flex items-center gap-4">
        <AssetIcon src={assetLogoSrc(group.views[0]?.id ?? "")} label={group.name} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base text-black truncate">{group.name}</p>
            <span className="text-[10px] lowercase tracking-wide text-emerald-600">
              ● live
            </span>
            {positionTotal > 0 && (
              <span className="text-[10px] lowercase tracking-wide text-[#3c05c7]">
                · you&apos;re in
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {group.views.map((v) => (
              <span
                key={v.id}
                className="text-[10px] lowercase tracking-wide text-black/55 px-1.5 py-0.5 rounded border border-black/15"
              >
                {v.assetSymbol}
              </span>
            ))}
          </div>
          {positionTotal > 0 && (
            <p className="mt-2 text-[11px] text-black/55">
              your position: ${positionTotal.toFixed(2)}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl text-black tabular-nums">
            up to {(group.maxApy * 100).toFixed(2)}%
          </p>
          <p
            className={`text-[10px] lowercase tracking-wide ${
              RISK_TONE[top.riskLevel] ?? "text-black/55"
            }`}
          >
            {RISK_LABEL[top.riskLevel] ?? top.riskLevel}
          </p>
        </div>

        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="text-black/40 group-hover:text-black transition shrink-0"
        />
      </div>
    </button>
  );
}
