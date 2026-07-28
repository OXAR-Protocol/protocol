"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { groupByDay, summarizeDays, utcDayStart, formatUsdAmount, formatSignedUsd } from "@oxar/sdk";

import { SectionLabel } from "@/components/section-label";
import { HoverChart } from "@/components/hover-chart";
import { DayHistory } from "@/components/day-history";
import { useActivity } from "@/hooks/use-activity";
import { usePortfolioHistory } from "@/hooks/use-portfolio-history";
import { useT } from "@/lib/i18n";

/** How far back to look. Matches the asset chart's vocabulary. */
const RANGES = [7, 30, 90, 365] as const;
type Range = (typeof RANGES)[number];

/** Deep enough to cover a year of ordinary use; the route caps it anyway. */
const EVENT_LIMIT = 500;

/**
 * The history tool: what the portfolio was worth over time, and every transaction
 * that moved it, read as days.
 *
 * The chart alone can't answer "what did I actually do" — it's a line with no events
 * on it. This page joins the two: pick a stretch of time, see the shape of it, then
 * read down through the days that made that shape.
 */
export default function ActivityPage() {
  const { t, locale } = useT();
  const [range, setRange] = useState<Range>(30);
  const { events, loading: loadingEvents } = useActivity(EVENT_LIMIT);
  const { points, loading: loadingChart } = usePortfolioHistory(range);

  const days = useMemo(() => {
    // The window comes from the value series rather than from the clock: it is by
    // definition the stretch the chart above is drawing, so the list and the line
    // can't disagree about what "30 days" means. With no series, show everything.
    const cutoff = points.length ? utcDayStart(points[0]!.t) : 0;
    return groupByDay(
      events.filter((e) => e.timestamp >= cutoff),
      points,
    );
  }, [events, points]);

  const stats = useMemo(() => summarizeDays(days), [days]);
  const loading = loadingEvents || loadingChart;

  return (
    <div className="mx-auto max-w-[800px] px-4 pt-8 pb-32">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionLabel>history</SectionLabel>
        <h1 className="mt-4 text-[clamp(26px,4vw,44px)] leading-[1.04] tracking-[-0.04em] text-black lowercase">
          {t("history.title")}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-black/45">{t("history.subtitle")}</p>
      </motion.div>

      {/* Range */}
      <div className="mt-6 flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full border px-3.5 py-1.5 text-xs lowercase tracking-wide transition ${
              range === r
                ? "border-[#3c05c7]/50 bg-[#3c05c7]/[0.06] text-black"
                : "border-black/10 text-black/55 hover:border-black/30 hover:text-black"
            }`}
          >
            {t(`history.range.${r}` as "history.range.7")}
          </button>
        ))}
      </div>

      {/* Shape of the range */}
      <div className="mt-4 rounded-[12px] border border-black/10 bg-white p-4">
        {loading ? (
          <div className="flex h-[110px] items-center justify-center text-black/30">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : points.length > 0 ? (
          <HoverChart
            values={points.map((p) => p.usd)}
            format={(v) => `$${formatUsdAmount(v)}`}
            height={110}
            className="text-[#3c05c7]"
            fill
          />
        ) : (
          <p className="py-10 text-center text-[13px] text-black/40">{t("history.noChart")}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/[0.06] pt-4 sm:grid-cols-4">
          <Stat
            label={t("history.change")}
            value={stats.changeUsd === null ? "—" : formatSignedUsd(stats.changeUsd)}
            hint={stats.changePct === null ? undefined : `${(stats.changePct * 100).toFixed(1)}%`}
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

      {/* Day by day */}
      <div className="mt-8">
        <SectionLabel>{t("history.byDay")}</SectionLabel>
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-10 text-black/30">
              <Loader2 size={16} className="animate-spin" />
            </div>
          ) : (
            <DayHistory days={days} locale={locale} />
          )}
        </div>
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
