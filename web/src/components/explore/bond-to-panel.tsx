"use client";

import { ChevronDown } from "lucide-react";
import type { VaultConfig } from "@oxar/sdk";

import { getBondColor } from "@/lib/bond-constants";
import { getBondName } from "@/lib/bond-labels";
import { getBondCity } from "@/lib/bond-cities";
import { TokenMark } from "./token-mark";

interface BondToPanelProps {
  config: VaultConfig;
  receiveAmount: number;
  hasAmount: boolean;
  apyPercent: number;
  onSelectBond: () => void;
}

export function BondToPanel({
  config,
  receiveAmount,
  hasAmount,
  apyPercent,
  onSelectBond,
}: BondToPanelProps) {
  const { color, rgb } = getBondColor(config.denomination);
  const tokenName = `ox${config.denomination}`;
  const bondName = getBondName(config);
  const city = getBondCity(config.id);

  return (
    <button
      onClick={onSelectBond}
      className="h-full w-full rounded-[5px] border border-white/10 bg-surface-0 p-6 text-left flex flex-col justify-between transition-colors hover:border-white/20 group min-h-[360px]"
      style={{ boxShadow: `0 0 60px rgba(${rgb},0.05)` }}
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            To
          </label>
          <span className="font-mono text-[10px] text-white/20">
            After 12 months
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TokenMark symbol={config.denomination} color={color} rgb={rgb} />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-base text-white">{tokenName}</span>
              <ChevronDown
                size={14}
                className="text-white/40 group-hover:text-white transition-colors"
              />
            </div>
            <span className="font-mono text-[10px] text-white/30 uppercase truncate">
              {bondName}
            </span>
          </div>
        </div>
      </div>

      <div className="border-y border-white/[0.06] py-5 my-5">
        <span className="font-mono text-5xl font-light text-white block truncate tabular-nums">
          {hasAmount
            ? receiveAmount.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })
            : "0"}
        </span>
        <span className="font-mono text-[10px] mt-1 block uppercase tracking-wide" style={{ color }}>
          {apyPercent.toFixed(1)}% annual yield
        </span>
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wide">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-white/40">
            {city?.name ?? "Ukraine"}
          </span>
        </div>
        <span className="text-white/25">
          {config.isWar ? "War Bond" : "Gov Bond"}
        </span>
      </div>
    </button>
  );
}
