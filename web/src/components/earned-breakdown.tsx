"use client";

import { formatSignedUsd, isDustUsd, type RangePerformance } from "@oxar/sdk";

import { isCashMint, nameOfMint } from "@/lib/yield/mint-names";
import { useT } from "@/lib/i18n";

/**
 * Where a period's earnings actually came from.
 *
 * A single net figure that can go negative is unanswerable on its own: one holding
 * that fell and one trade that cost look exactly alike from the outside, and the
 * reader is left assuming the worse of the two. This says which — first by cause
 * (the market, or what changing holdings cost to execute), then by holding.
 *
 * Collapsed by default, because the answer is only wanted when the question comes up.
 */
export function EarnedBreakdown({ performance }: { performance: RangePerformance }) {
  const { t } = useT();
  const rows = byHolding(performance.perMint, t("history.cash"), t("history.other"));

  return (
    <div className="mt-3 rounded-[8px] bg-black/[0.02] px-3 py-2.5">
      <Line label={t("history.market")} amount={performance.marketUsd} />
      <Line label={t("history.tradingCost")} amount={performance.costUsd} />

      {rows.length > 0 && (
        <div className="mt-2 space-y-0 border-t border-black/[0.06] pt-2">
          {rows.map((r) => (
            <Line key={r.label} label={r.label} amount={r.amount} />
          ))}
        </div>
      )}
    </div>
  );
}

function Line({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="truncate text-[11px] lowercase text-black/45">{label}</span>
      <span
        className={`shrink-0 text-[11px] tabular-nums ${amount < 0 ? "text-red-600" : "text-black/70"}`}
      >
        {formatSignedUsd(amount)}
      </span>
    </div>
  );
}

/**
 * One line per holding, biggest first.
 *
 * Every dollar the wallet holds collapses into a single row — "USDC −$0.00, USDG
 * −$0.01, USDT $0.00" is noise standing where an explanation should be. Anything too
 * small to print keeps its money in a "rest" row rather than being dropped, so the
 * lines still add up to the figure they are explaining.
 */
function byHolding(
  perMint: Record<string, number>,
  cashLabel: string,
  otherLabel: string,
): { label: string; amount: number }[] {
  const named = new Map<string, number>();
  let unnamed = 0;

  for (const [mint, amount] of Object.entries(perMint)) {
    const label = isCashMint(mint) ? cashLabel : nameOfMint(mint);
    if (label === null) unnamed += amount;
    else named.set(label, (named.get(label) ?? 0) + amount);
  }

  const rows: { label: string; amount: number }[] = [];
  for (const [label, amount] of named) {
    if (isDustUsd(Math.abs(amount))) unnamed += amount;
    else rows.push({ label, amount });
  }
  rows.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  if (!isDustUsd(Math.abs(unnamed))) rows.push({ label: otherLabel, amount: unnamed });
  return rows;
}
