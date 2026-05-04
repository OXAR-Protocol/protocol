"use client";

import { ArrowDown, ChevronDown } from "lucide-react";
import type { VaultConfig } from "@oxar/sdk";

import { getBondColor } from "@/lib/bond-constants";
import { getBondName } from "@/lib/bond-labels";
import { TokenMark } from "./token-mark";

interface BondSwapFormProps {
  config: VaultConfig;
  amount: string;
  receiveAmount: number;
  hasAmount: boolean;
  onAmountChange: (value: string) => void;
  onSelectBond: () => void;
}

const PRESETS = [
  { label: "$100", value: 100 },
  { label: "$1K", value: 1_000 },
  { label: "$10K", value: 10_000 },
  { label: "$100K", value: 100_000 },
];

export function BondSwapForm({
  config,
  amount,
  receiveAmount,
  hasAmount,
  onAmountChange,
  onSelectBond,
}: BondSwapFormProps) {
  const { color, rgb } = getBondColor(config.denomination);
  const tokenName = `ox${config.denomination}`;
  const bondName = getBondName(config);

  return (
    <div className="flex flex-col">
      <div className="rounded-[5px] border border-white/10 bg-surface-0 p-5 transition-colors hover:border-white/15">
        <div className="flex items-center justify-between mb-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            From
          </label>
          <span className="font-mono text-[10px] text-white/20">
            Pay with stablecoin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <TokenMark symbol="USDC" color="#ffffff" rgb="255,255,255" />
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-base text-white">USDC</span>
              <span className="font-mono text-[10px] text-white/30 uppercase">
                USD Coin
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-end min-w-0">
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="bg-transparent text-white font-mono text-3xl font-light w-full outline-none placeholder:text-white/15 text-right min-w-0"
            />
            <span className="font-mono text-[10px] text-white/25 mt-0.5">
              {hasAmount
                ? `~$${parseFloat(amount).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}`
                : "~$0.00"}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => onAmountChange(p.value.toString())}
              className="font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex justify-center" style={{ height: "0" }}>
        <div className="absolute -top-4 w-8 h-8 rounded-full border border-white/15 bg-surface-0 flex items-center justify-center z-10">
          <ArrowDown size={14} className="text-white/50" />
        </div>
      </div>

      <button
        onClick={onSelectBond}
        className="mt-4 rounded-[5px] border border-white/10 bg-surface-0 p-5 text-left transition-colors hover:border-white/20 group"
        style={{ boxShadow: `0 0 60px rgba(${rgb},0.05)` }}
      >
        <div className="flex items-center justify-between mb-4">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            To
          </label>
          <span className="font-mono text-[10px] text-white/20">
            After 12 months
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <TokenMark symbol={config.denomination} color={color} rgb={rgb} />
            <div className="flex flex-col min-w-0 items-start">
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-base text-white">{tokenName}</span>
                <ChevronDown
                  size={14}
                  className="text-white/40 group-hover:text-white transition-colors"
                />
              </div>
              <span className="font-mono text-[10px] text-white/30 uppercase truncate max-w-[140px]">
                {bondName}
              </span>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-end min-w-0">
            <span className="font-mono text-3xl font-light text-white truncate w-full text-right">
              {hasAmount
                ? receiveAmount.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })
                : "0"}
            </span>
            <span className="font-mono text-[10px] mt-0.5" style={{ color }}>
              {config.apy.toFixed(1)}% APY
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
