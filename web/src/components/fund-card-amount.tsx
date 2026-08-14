"use client";

import { Info } from "lucide-react";

import { AmountKeypad } from "@/components/amount-keypad";
import { AnimatedAmount } from "@/components/animated-amount";
import { useT } from "@/lib/i18n";

const PRESETS = [20, 100, 250, 500];

/**
 * How much to put on the card before the provider takes over.
 *
 * The deposit panel could skip this — it already knew the amount, because there it
 * doubles as "how much of this asset". Funding on its own has no such number, and
 * sending someone into a payment widget with a blank field is where they stop.
 *
 * The sum gets the screen and its own keypad: this is a phone flow, and a system
 * keyboard here would cover the presets that answer the question for most people.
 */
export function FundCardAmount({
  value,
  min,
  onChange,
  onContinue,
}: {
  value: string;
  min: number;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const { t } = useT();
  const usd = Number(value);
  const belowMin = !Number.isFinite(usd) || usd < min;

  return (
    <div>
      <p className="text-center text-[11px] lowercase tracking-wide text-ink/40">
        {t("fund.card.amount")}
      </p>
      <p className="mt-1 text-center text-[2.6rem] font-light leading-none tracking-[-0.03em] text-ink">
        <span className={value === "" ? "text-ink/25" : "text-ink/45"}>$</span>
        <AnimatedAmount value={value} />
      </p>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(String(preset))}
            className={`rounded-full border py-2 text-[13px] tabular-nums transition ${
              value === String(preset)
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 text-ink/60 hover:border-ink/40 hover:text-ink"
            }`}
          >
            ${preset}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <AmountKeypad value={value} onChange={onChange} />
      </div>

      {/* Their line, and it's true: debit clears where credit gets blocked for
          anything that looks like crypto. */}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink/40">
        <Info size={12} strokeWidth={1.5} />
        {t("fund.card.debitHint")}
      </p>

      <button
        type="button"
        onClick={onContinue}
        disabled={belowMin}
        className="mt-4 w-full rounded-full bg-ink px-4 py-3.5 text-[14px] lowercase tracking-wide text-paper transition hover:bg-ink/85 disabled:opacity-30"
      >
        {belowMin ? t("fund.card.min", { min: String(min) }) : t("fund.card.continue")}
      </button>
    </div>
  );
}
