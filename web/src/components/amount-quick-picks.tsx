"use client";

import { Plus } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { useT } from "@/lib/i18n";

const FRACTIONS = [0.1, 0.25, 0.5, 1] as const;

/**
 * How much of what you have, in one tap — and what you have, said out loud.
 *
 * Typing an amount means first knowing the ceiling, and the ceiling was only
 * visible inside the pay-with field. Here it's a line of its own, with the way to
 * raise it attached: the plus opens topping up, because "not enough" and "add
 * more" are the same thought a second apart.
 */
export function AmountQuickPicks({
  available,
  onPick,
  onTopUp,
  disabled,
}: {
  /** Spendable amount in the pay asset's own units. */
  available: number;
  onPick: (value: number) => void;
  onTopUp?: () => void;
  disabled?: boolean;
}) {
  const { t } = useT();

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {FRACTIONS.map((f) => (
          <button
            key={f}
            type="button"
            disabled={disabled || available <= 0}
            onClick={() => onPick(available * f)}
            className="flex-1 rounded-full border border-ink/15 py-1.5 text-[11px] lowercase tracking-wide text-ink/55 transition hover:border-ink/40 hover:text-ink disabled:opacity-40"
          >
            {f === 1 ? t("rail.max") : `${f * 100}%`}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[11px] tabular-nums text-ink/40">
        <span>
          ${formatUsdAmount(available)} {t("rail.available")}
        </span>
        {onTopUp && (
          <button
            type="button"
            onClick={onTopUp}
            aria-label={t("wallet.fund")}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-ink/20 text-ink/45 transition hover:border-ink/50 hover:text-ink"
          >
            <Plus size={10} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
