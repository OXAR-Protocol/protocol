"use client";

import { ArrowUpDown } from "lucide-react";

import { floorToCents, centPrecision, floorTo } from "@oxar/sdk";

import { useT } from "@/lib/i18n";

/** Quick fractions of the position. 100% is offered as its own button below. */
const FRACTIONS = [0.25, 0.5, 0.75] as const;

interface Props {
  /** Full position value in USD. */
  positionValue: number;
  /** Current sell amount in USD (the field is USD-denominated). */
  amount: number;
  onAmountChange: (usd: number) => void;
  /** USD price of one unit — enables the units view. Absent for yield sources. */
  unitPriceUsd?: number;
  /** Ticker for one unit, e.g. "AVGOx". */
  unitLabel?: string;
  /** Show units instead of dollars. */
  inUnits: boolean;
  onToggleUnits: () => void;
  disabled?: boolean;
}

/**
 * Quick ways to say how much to sell: fractions of the position, and a units view
 * for people who think in shares rather than dollars (the buy side already offers
 * one). Everything still resolves to a USD amount, because that is what the sell
 * path and its preview take — the units view is a lens on the same number, not a
 * second source of truth.
 */
export function SellAmountControls({
  positionValue,
  amount,
  onAmountChange,
  unitPriceUsd,
  unitLabel,
  inUnits,
  onToggleUnits,
  disabled,
}: Props) {
  const { t } = useT();
  const canShowUnits = !!unitPriceUsd && unitPriceUsd > 0 && !!unitLabel;
  // A fraction of a position is money, so it rounds like money. The full exit is
  // NOT floored — planWithdrawal reads all-but-a-cent as all, and flooring here
  // would only widen the gap it has to forgive.
  const setFraction = (f: number) => onAmountChange(floorToCents(positionValue * f));

  const chip = (active: boolean) =>
    `rounded-full px-2.5 py-1 text-[11px] lowercase tracking-wide transition ${
      active ? "bg-ink text-paper" : "bg-ink/[0.05] text-ink/55 hover:text-ink"
    } disabled:cursor-not-allowed disabled:opacity-40`;

  const heldUnits = canShowUnits ? positionValue / unitPriceUsd! : 0;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {FRACTIONS.map((f) => (
        <button
          key={f}
          type="button"
          disabled={disabled || positionValue <= 0}
          onClick={() => setFraction(f)}
          className={chip(Math.abs(amount - positionValue * f) < 0.005 && amount > 0)}
        >
          {f * 100}%
        </button>
      ))}
      <button
        type="button"
        disabled={disabled || positionValue <= 0}
        onClick={() => onAmountChange(positionValue)}
        className={chip(amount >= positionValue && positionValue > 0)}
      >
        {t("rail.sellAll")}
      </button>

      {canShowUnits && (
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleUnits}
          className="ml-auto inline-flex items-center gap-1.5 text-[11px] lowercase tracking-wide text-ink/40 transition hover:text-ink/70"
          title={t("rail.switchUnits")}
          aria-label={t("rail.switchUnits")}
        >
          <ArrowUpDown size={12} strokeWidth={1.5} />
          {inUnits ? "USDC" : unitLabel}
        </button>
      )}

      {canShowUnits && (
        <span className="w-full text-[11px] tabular-nums text-ink/35">
          {t("rail.youHold", {
            n: String(floorTo(heldUnits, centPrecision(unitPriceUsd!))),
            sym: unitLabel!,
          })}
        </span>
      )}
    </div>
  );
}
