"use client";

import { Loader2 } from "lucide-react";

import {
  formatUsdAmount,
  formatSignedUsd,
  formatDayShort,
  type PerformanceDay,
  type RangePerformance,
  type ActivityCount,
} from "@oxar/sdk";

import { HoverChart } from "@/components/hover-chart";
import { useT } from "@/lib/i18n";

/** How far back to look. */
export const RANGES = [7, 30, 90, 365] as const;
export type Range = (typeof RANGES)[number];

interface Props {
  points: PerformanceDay[];
  /** Earned, return and flows — from the value series itself. */
  performance: RangePerformance | null;
  /** Only the trade COUNT comes from the activity feed; every figure that is money
   *  comes from `performance`, so the two can't describe different periods. */
  counts: ActivityCount;
  range: Range;
  onRangeChange: (r: Range) => void;
  loading: boolean;
  locale: string;
}

/**
 * The portfolio's shape over a chosen stretch of time.
 *
 * It used to be a bare line: a fixed 90 days, no way to change it, and every point's
 * timestamp thrown away before it reached the chart — so a scrub told you what the
 * money was worth but never when. A line you can't read a date off is decoration.
 * The numbers under it are the same range summed up, so the picture and the figures
 * can't be describing different periods.
 */
export function PortfolioChart({
  points,
  performance,
  counts,
  range,
  onRangeChange,
  loading,
  locale,
}: Props) {
  const { t } = useT();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={`rounded-full px-2.5 py-1 text-[11px] lowercase tracking-wide transition ${
              range === r ? "bg-black text-white" : "bg-black/[0.05] text-black/55 hover:text-black"
            }`}
          >
            {t(`history.range.${r}` as "history.range.7")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-[110px] items-center justify-center text-black/25">
          <Loader2 size={16} className="animate-spin" />
        </div>
      ) : points.length > 1 ? (
        <HoverChart
          values={points.map((p) => p.usd)}
          labels={points.map((p) => formatDayShort(p.t, locale))}
          format={(v) => `$${formatUsdAmount(v)}`}
          height={110}
          className="text-[#3c05c7]"
          fill
        />
      ) : (
        <p className="py-10 text-center text-[12px] text-black/35">{t("history.noChart")}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/[0.06] pt-4 sm:grid-cols-4">
        {/* What you made, not what you moved. The figure this replaced was end-minus-
            start, which a deposit inflates and a withdrawal erases — it read as profit
            and wasn't. The percentage beside it is time-weighted, so it survives a
            range that opens before the wallet held anything and a deposit inside one. */}
        <Stat
          label={t("history.earned")}
          value={performance?.earnedUsd == null ? "—" : formatSignedUsd(performance.earnedUsd)}
          hint={
            performance?.returnPct == null
              ? undefined
              : `${performance.returnPct >= 0 ? "+" : ""}${(performance.returnPct * 100).toFixed(2)}%`
          }
          negative={performance?.earnedUsd != null && performance.earnedUsd < 0}
        />
        <Stat label={t("history.putIn")} value={`$${formatUsdAmount(performance?.inUsd ?? 0)}`} />
        <Stat label={t("history.tookOut")} value={`$${formatUsdAmount(performance?.outUsd ?? 0)}`} />
        <Stat
          label={t("history.trades")}
          value={String(counts.trades)}
          hint={counts.activeDays > 0 ? t("history.onDays", { n: String(counts.activeDays) }) : undefined}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  negative,
}: {
  label: string;
  value: string;
  hint?: string;
  negative?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] lowercase tracking-wide text-black/40">{label}</p>
      <p className={`mt-0.5 text-[15px] tabular-nums ${negative ? "text-red-600" : "text-black"}`}>{value}</p>
      {hint && <p className="text-[11px] tabular-nums text-black/35">{hint}</p>}
    </div>
  );
}
