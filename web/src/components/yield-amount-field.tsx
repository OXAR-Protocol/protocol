"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { normalizeDecimalInput } from "@oxar/sdk";

import { SwipeToConfirm } from "@/components/swipe-to-confirm";

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
  /** Extra controls (quick fractions, denomination switch) rendered between the hint
   *  and the action — inside the card, beside the amount they change. */
  controls?: ReactNode;
  /** Press-and-hold instead of a tap. For the acts that can't be undone: buying
   *  already holds, and selling is no easier to take back. */
  hold?: boolean;
}

const BUTTON_VARIANT = {
  primary: "bg-black text-white hover:bg-black/85",
  secondary: "border border-black/20 hover:border-black/40 text-black",
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
  controls,
  hold,
}: Props) {
  return (
    <div className="p-4 rounded-[6px] border border-black/10 bg-white">
      <p className="text-[10px] lowercase tracking-wide text-black/40 mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <input
          type="text"
          min={0}
          step="any"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(normalizeDecimalInput(e.target.value)) || 0))}
          className="flex-1 bg-transparent border-b border-black/15 focus:border-black/40 outline-none text-2xl text-black py-1"
        />
        <span className="text-sm text-black/45">{symbol}</span>
      </div>
      <div className="mt-2 text-[11px] text-black/40">{hint}</div>
      {controls}
      {hold ? (
        <SwipeToConfirm label={actionLabel} busy={loading} disabled={disabled} onConfirm={onAction} />
      ) : (
        <button
          onClick={onAction}
          disabled={disabled}
          className={`mt-3 w-full px-4 py-3 rounded-full text-[14px] font-medium lowercase tracking-wide disabled:opacity-30 transition inline-flex items-center justify-center gap-2 ${BUTTON_VARIANT[variant]}`}
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
      )}
    </div>
  );
}
