"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  formatUsdAmount,
  formatSignedUsd,
  isDustUsd,
  type RangePerformance,
  type ActivityCount,
} from "@oxar/sdk";

import { EarnedBreakdown } from "@/components/earned-breakdown";
import { type Range } from "@/lib/history-range";
import { useT } from "@/lib/i18n";

/**
 * The four figures under the line: what the range earned, what went in, what came
 * out, and how much was done. All of them come from the value series the chart
 * draws, so the picture and the numbers cannot be describing different periods.
 */
export function PerformanceStats({
  performance,
  heldMints,
  counts,
  range,
}: {
  performance: RangePerformance | null;
  /** Still held today; anything else in the breakdown was closed inside the range. */
  heldMints: string[];
  /** Only the trade COUNT comes from the activity feed; every figure that is money
   *  comes from `performance`. */
  counts: ActivityCount;
  range: Range;
}) {
  const { t } = useT();
  const [showBreakdown, setShowBreakdown] = useState(false);
  // Nothing to open when the range earned nothing anyone can attribute.
  const explainable = !!performance && performance.earnedUsd !== null;
  // The cost of trading is shown beside the figure only when there IS one — on a
  // wallet that only ever deposited it would be a row of zeros, and on one that
  // traded it is usually the whole story behind a small negative.
  const traded = !!performance && !isDustUsd(Math.abs(performance.costUsd));

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/[0.06] pt-4 sm:grid-cols-4">
        {/* What you made, not what you moved. The figure this replaced was end-minus-
            start, which a deposit inflates and a withdrawal erases — it read as profit
            and wasn't. The percentage beside it is time-weighted, so it survives a
            range that opens before the wallet held anything and a deposit inside one. */}
        <Stat
          label={`${t("history.earned")} · ${t(`history.range.${range}` as "history.range.7")}`}
          value={performance?.earnedUsd == null ? "—" : formatSignedUsd(performance.earnedUsd)}
          hint={
            performance?.returnPct == null
              ? undefined
              : `${performance.returnPct >= 0 ? "+" : ""}${(performance.returnPct * 100).toFixed(2)}%`
          }
          note={
            traded && performance
              ? `${t("history.tradingCost")} ${formatSignedUsd(performance.costUsd)}`
              : undefined
          }
          negative={performance?.earnedUsd != null && performance.earnedUsd < 0}
          action={
            explainable ? (
              <button
                type="button"
                onClick={() => setShowBreakdown((open) => !open)}
                aria-expanded={showBreakdown}
                aria-label={t("history.byAsset")}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-black/[0.05] text-black/40 transition hover:text-black"
              >
                <ChevronDown
                  size={10}
                  strokeWidth={2}
                  className={`transition-transform ${showBreakdown ? "rotate-180" : ""}`}
                />
              </button>
            ) : undefined
          }
        />
        <Stat label={t("history.putIn")} value={`$${formatUsdAmount(performance?.inUsd ?? 0)}`} />
        <Stat label={t("history.tookOut")} value={`$${formatUsdAmount(performance?.outUsd ?? 0)}`} />
        <Stat
          label={t("history.trades")}
          value={String(counts.trades)}
          hint={counts.activeDays > 0 ? t("history.onDays", { n: String(counts.activeDays) }) : undefined}
        />
      </div>

      {showBreakdown && performance && (
        <EarnedBreakdown performance={performance} heldMints={heldMints} />
      )}
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  note,
  negative,
  action,
}: {
  label: string;
  value: string;
  hint?: string;
  note?: string;
  negative?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10px] lowercase tracking-wide text-black/40">
        {label}
        {action}
      </p>
      <p className={`mt-0.5 text-[15px] tabular-nums ${negative ? "text-red-600" : "text-black"}`}>{value}</p>
      {hint && <p className="text-[11px] tabular-nums text-black/35">{hint}</p>}
      {note && <p className="text-[10px] lowercase tabular-nums text-black/30">{note}</p>}
    </div>
  );
}
