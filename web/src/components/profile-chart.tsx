"use client";

import { Loader2 } from "lucide-react";

import {
  formatUsdAmount,
  formatSignedUsd,
  formatDayShort,
  type PerformanceDay,
  type RangePerformance,
} from "@oxar/sdk";

import { HoverChart } from "@/components/hover-chart";
import { RANGES, type Range } from "@/components/portfolio-chart";
import { useT } from "@/lib/i18n";

/**
 * What everything is worth, and the shape it took getting there.
 *
 * Two big numbers on one screen with no labels is a riddle, so this one says what
 * it is before it says how much: everything together, wallet and working money
 * both. The figure beside the plus is what's merely free to spend, and it is a size
 * smaller now — of two numbers, only one can be the headline.
 *
 * The line runs edge to edge. Data reads better without a margin holding it in, and
 * the range chips carry the framing a border was doing.
 */
export function ProfileChart({
  points,
  performance,
  range,
  onRangeChange,
  loading,
  locale,
}: {
  points: PerformanceDay[];
  performance: RangePerformance | null;
  range: Range;
  onRangeChange: (r: Range) => void;
  loading: boolean;
  locale: string;
}) {
  const { t } = useT();

  const now = points.length ? points[points.length - 1]!.usd : 0;
  const earned = performance?.earnedUsd ?? null;
  const up = earned === null || earned >= 0;

  return (
    <section>
      <p className="text-[11px] lowercase tracking-wide text-black/40">{t("profile.allTogether")}</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <p className="text-[clamp(30px,6vw,44px)] font-light leading-none tracking-[-0.02em] tabular-nums text-black">
            ${formatUsdAmount(now)}
          </p>
          <p className={`whitespace-nowrap text-[13px] tabular-nums ${up ? "text-emerald-600" : "text-red-600"}`}>
            {earned === null ? "—" : formatSignedUsd(earned)}
            <span className="text-black/40"> · {t(`history.range.${range}` as "history.range.7")}</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5">
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
      </div>

      {/* Full-bleed on a phone: the page's own padding stops at the chart's edge. */}
      <div className="mt-4 -mx-5 sm:mx-0">
        {loading ? (
          <div className="flex h-[150px] items-center justify-center text-black/25">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : points.length > 1 ? (
          <HoverChart
            values={points.map((p) => p.usd)}
            labels={points.map((p) => formatDayShort(p.t, locale))}
            format={(v) => `$${formatUsdAmount(v)}`}
            height={150}
            className={up ? "text-emerald-600" : "text-red-600"}
            fill
          />
        ) : (
          <p className="py-12 text-center text-[12px] text-black/35">{t("history.noChart")}</p>
        )}
      </div>
    </section>
  );
}
