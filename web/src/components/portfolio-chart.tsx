"use client";

import { Loader2 } from "lucide-react";

import {
  formatUsdAmount,
  formatSignedUsd,
  formatDayShort,
  type PortfolioPoint,
  type RangeStats,
} from "@oxar/sdk";

import { HoverChart } from "@/components/hover-chart";
import { useT } from "@/lib/i18n";

/** How far back to look. */
export const RANGES = [7, 30, 90, 365] as const;
export type Range = (typeof RANGES)[number];

interface Props {
  points: PortfolioPoint[];
  stats: RangeStats;
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
export function PortfolioChart({ points, stats, range, onRangeChange, loading, locale }: Props) {
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
        {/* Dollars only. The percentage under this figure divided the change by the
            range's opening value, so a wallet that grew by moving its own cash into
            positions read as "+4181.7%" on 7 days and showed nothing at all on 90 —
            where the range opens before there was anything to grow from. Neither was
            information. See `RangeStats.changeUsd`. */}
        <Stat
          label={t("history.change")}
          value={stats.changeUsd === null ? "—" : formatSignedUsd(stats.changeUsd)}
          negative={stats.changeUsd !== null && stats.changeUsd < 0}
        />
        <Stat label={t("history.putIn")} value={`$${formatUsdAmount(stats.inUsd)}`} />
        <Stat label={t("history.tookOut")} value={`$${formatUsdAmount(stats.outUsd)}`} />
        <Stat
          label={t("history.trades")}
          value={String(stats.trades)}
          hint={stats.activeDays > 0 ? t("history.onDays", { n: String(stats.activeDays) }) : undefined}
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
