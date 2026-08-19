"use client";

/**
 * "How much of what I have" — one row of chips, one look, both directions.
 *
 * Buying and selling ask the same question and used to answer it in two visual
 * languages: full-width bordered pills on the way in, small filled chips on the
 * way out. Same screen, same gesture, different button — which reads as two
 * products rather than two directions of one. The ladders still differ (a tenth
 * of your money is a reasonable buy, a tenth of a position is a pointless sell),
 * because that is a decision per side; the button is not.
 */
export interface FractionOption {
  /** Fraction of the available amount, 0–1. */
  value: number;
  label: string;
}

export function FractionChips({
  options,
  onPick,
  isActive,
  disabled,
}: {
  options: readonly FractionOption[];
  onPick: (fraction: number) => void;
  /** Optional — the sell side highlights the chip that matches the amount. */
  isActive?: (fraction: number) => boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => {
        const active = isActive?.(o.value) ?? false;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onPick(o.value)}
            aria-pressed={active}
            className={`flex-1 rounded-full border py-1.5 text-[11px] lowercase tracking-wide transition disabled:opacity-40 ${
              active
                ? "border-ink/40 bg-ink/[0.06] text-ink"
                : "border-ink/15 text-ink/55 hover:border-ink/40 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
