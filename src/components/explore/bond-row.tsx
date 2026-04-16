"use client";

import type { VaultConfig } from "@oxar/sdk";

import { getBondColor } from "@/lib/bond-constants";
import { getBondName, getBondTerm } from "@/lib/bond-labels";
import { TokenMark } from "./token-mark";

interface BondRowProps {
  config: VaultConfig;
  selected: boolean;
  onClick: () => void;
}

export function BondRow({ config, selected, onClick }: BondRowProps) {
  const { color, rgb } = getBondColor(config.denomination);

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-[5px] text-left transition-colors ${
        selected ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
      }`}
    >
      <TokenMark symbol={config.denomination} color={color} rgb={rgb} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm text-white">ox{config.denomination}</span>
          {config.isWar && (
            <span
              className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded"
              style={{ color, background: `rgba(${rgb},0.1)` }}
            >
              WAR
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-white/30 uppercase block truncate">
          {getBondName(config)} &middot; {getBondTerm(config)}
        </span>
      </div>
      <div className="text-right shrink-0">
        <span className="font-mono text-sm font-light" style={{ color }}>
          {config.apy.toFixed(1)}%
        </span>
        <span className="font-mono text-[10px] text-white/25 block">APY</span>
      </div>
    </button>
  );
}
