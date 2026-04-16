"use client";

import { ChevronDown } from "lucide-react";

import { getPaymentMethod } from "@/lib/payment-methods";
import { TokenMark } from "./token-mark";

interface BondFromPanelProps {
  selectedMethodId: string;
  amount: string;
  hasAmount: boolean;
  onAmountChange: (value: string) => void;
  onSelectMethod: () => void;
}

const PRESETS = [
  { label: "$100", value: 100 },
  { label: "$1K", value: 1_000 },
  { label: "$10K", value: 10_000 },
  { label: "$100K", value: 100_000 },
];

export function BondFromPanel({
  selectedMethodId,
  amount,
  hasAmount,
  onAmountChange,
  onSelectMethod,
}: BondFromPanelProps) {
  const method = getPaymentMethod(selectedMethodId);
  if (!method) return null;

  return (
    <div className="h-full rounded-[5px] border border-white/10 bg-surface-0 p-6 flex flex-col justify-between transition-colors hover:border-white/15 min-h-[360px]">
      <div>
        <div className="flex items-center justify-between mb-5">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            From
          </label>
          <span className="font-mono text-[10px] text-white/20">
            {method.network}
          </span>
        </div>

        <button
          onClick={onSelectMethod}
          className="flex items-center gap-3 w-full text-left group"
        >
          <TokenMark
            symbol={method.symbol}
            color={method.color}
            rgb={method.rgb}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-base text-white">
                {method.symbol}
              </span>
              <ChevronDown
                size={14}
                className="text-white/40 group-hover:text-white transition-colors"
              />
            </div>
            <span className="font-mono text-[10px] text-white/30 uppercase truncate">
              {method.name}
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
        <span className="font-mono text-[10px] text-white/25 mt-1 block uppercase tracking-wide">
          {hasAmount
            ? `~$${parseFloat(amount).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })} usd`
            : "Enter amount to invest"}
        </span>
      </div>

      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => onAmountChange(p.value.toString())}
            className="flex-1 font-mono text-[10px] uppercase tracking-wide py-2 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
