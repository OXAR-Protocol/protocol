"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  /** Section label, e.g. "Deposit USDC". */
  label: string;
  symbol: string;
  value: number;
  onChange: (v: number) => void;
  /** Sub-line under the input (wallet balance / available + max button). */
  hint: ReactNode;
  actionLabel: string;
  onAction: () => void;
  loading: boolean;
  disabled: boolean;
  /** Filled (deposit) vs outlined (withdraw) button treatment. */
  variant: "primary" | "secondary";
}

const BUTTON_VARIANT = {
  primary: "bg-white text-black hover:bg-white/90",
  secondary: "border border-white/20 hover:border-white/40 text-white",
} as const;

/** One deposit/withdraw input + action button. Shared so both flows stay in sync. */
export function YieldAmountField({
  label,
  symbol,
  value,
  onChange,
  hint,
  actionLabel,
  onAction,
  loading,
  disabled,
  variant,
}: Props) {
  return (
    <div className="p-4 rounded-[6px] border border-white/10">
      <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <input
          type="number"
          min={0}
          step="any"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="flex-1 bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-2xl text-white py-1"
        />
        <span className="font-mono text-sm text-white/40">{symbol}</span>
      </div>
      <div className="mt-2 font-mono text-[11px] text-white/30">{hint}</div>
      <button
        onClick={onAction}
        disabled={disabled}
        className={`mt-3 w-full px-4 py-2.5 rounded-[5px] font-mono text-xs uppercase tracking-wide disabled:opacity-30 transition inline-flex items-center justify-center gap-2 ${BUTTON_VARIANT[variant]}`}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            Working…
          </>
        ) : (
          actionLabel
        )}
      </button>
    </div>
  );
}
