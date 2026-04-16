"use client";

import type { PaymentMethod } from "@/lib/payment-methods";
import { TokenMark } from "./token-mark";

interface PaymentRowProps {
  method: PaymentMethod;
  selected: boolean;
  onClick: () => void;
}

export function PaymentRow({ method, selected, onClick }: PaymentRowProps) {
  const disabled = !method.enabled;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 px-3 py-3 rounded-[5px] text-left transition-colors ${
        selected
          ? "bg-white/[0.05]"
          : disabled
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-white/[0.03]"
      }`}
    >
      <TokenMark
        symbol={method.symbol}
        color={method.color}
        rgb={method.rgb}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm text-white">{method.symbol}</span>
          {disabled && (
            <span
              className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border border-white/10 text-white/40"
            >
              Soon
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-white/30 uppercase block truncate">
          {method.name} &middot; {method.network}
        </span>
      </div>
      {selected && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: method.color }}
        />
      )}
    </button>
  );
}
