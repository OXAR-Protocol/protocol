"use client";

import { ChevronDown } from "lucide-react";
import type { VaultConfig } from "@oxar/sdk";

import { getBondColor } from "@/lib/bond-constants";
import { TokenMark } from "./token-mark";

interface HoldingFromPanelProps {
  config: VaultConfig;
  amount: string;
  hasAmount: boolean;
  balanceTokens: number;
  onAmountChange: (value: string) => void;
  onSelectMethod: () => void;
}

export function HoldingFromPanel({
  config,
  amount,
  hasAmount,
  balanceTokens,
  onAmountChange,
  onSelectMethod,
}: HoldingFromPanelProps) {
  const { color, rgb } = getBondColor(config.denomination);
  const tokenName = `ox${config.denomination}`;

  const presets = [
    { label: "25%", value: balanceTokens * 0.25 },
    { label: "50%", value: balanceTokens * 0.5 },
    { label: "75%", value: balanceTokens * 0.75 },
    { label: "MAX", value: balanceTokens },
  ];

  const parsedAmount = parseFloat(amount);
  const overBalance =
    !isNaN(parsedAmount) && parsedAmount > balanceTokens && balanceTokens > 0;

  return (
    <div
      className="h-full rounded-[5px] border border-white/10 bg-surface-0 p-6 flex flex-col justify-between transition-colors hover:border-white/15 min-h-[360px]"
      style={{ boxShadow: `0 0 60px rgba(${rgb},0.05)` }}
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            From
          </label>
          <span className="font-mono text-[10px] text-white/20">
            Send holding
          </span>
        </div>

        <button
          onClick={onSelectMethod}
          className="flex items-center gap-3 w-full text-left group"
        >
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
              Balance{" "}
              {balanceTokens.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </button>
      </div>

      <div className="border-y border-white/[0.06] py-5 my-5">
        <input
          type="number"
          placeholder="0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="bg-transparent text-white font-mono text-5xl font-light w-full outline-none placeholder:text-white/15 tabular-nums"
        />
        <span
          className={`font-mono text-[10px] mt-1 block uppercase tracking-wide ${
            overBalance ? "text-loss" : "text-white/25"
          }`}
        >
          {overBalance
            ? "Exceeds available balance"
            : hasAmount
              ? `${parseFloat(amount).toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })} ${tokenName}`
              : "Enter amount to send"}
        </span>
      </div>

      <div className="flex gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onAmountChange(p.value.toString())}
            disabled={balanceTokens <= 0}
            className="flex-1 font-mono text-[10px] uppercase tracking-wide py-2 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
