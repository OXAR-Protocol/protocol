"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { formatUsdAmount, formatSignedUsd, formatDayShort } from "@oxar/sdk";

import { HoverChart } from "@/components/hover-chart";
import { RANGES, type Range } from "@/components/portfolio-chart";
import { usePortfolioHistory } from "@/hooks/use-portfolio-history";
import { useT } from "@/lib/i18n";

/**
 * What everything is worth, and the shape it took getting there.
 *
 * The full picture with its four figures lives on the portfolio; this is the
 * headline of it — the number, what it made over the chosen stretch, and the line.
 * No card around it: the value is the page's first statement, so a border would
 * only put a box around the thing you came to see.
 *
 * The line takes its colour from the sign, which is the one place in the app where
 * green and red carry meaning rather than decoration: a glance should answer "up or
 * down" before any figure is read.
 */
export function ProfileChart() {
  const { t, locale } = useT();
  const [range, setRange] = useState<Range>(30);
  const { days, performance, loading } = usePortfolioHistory(range);

  const now = days.length ? days[days.length - 1]!.usd : 0;
  const earned = performance?.earnedUsd ?? null;
  const up = earned === null || earned >= 0;

  return (
    <section className="mt-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[clamp(30px,6vw,44px)] font-light leading-none tracking-[-0.02em] tabular-nums text-black">
            ${formatUsdAmount(now)}
          </p>
          <p className={`mt-2 text-[13px] tabular-nums ${up ? "text-emerald-600" : "text-red-600"}`}>
            {earned === null ? "—" : formatSignedUsd(earned)}{" "}
            <span className="text-black/40">
              {t(`history.range.${range}` as "history.range.7")}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-2.5 py-1 text-[11px] lowercase tracking-wide transition ${
                range === r ? "bg-black text-white" : "bg-black/[0.05] text-black/55 hover:text-black"
              }`}
            >
              {t(`history.range.${r}` as "history.range.7")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex h-[140px] items-center justify-center text-black/25">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : days.length > 1 ? (
          <HoverChart
            values={days.map((d) => d.usd)}
            labels={days.map((d) => formatDayShort(d.t, locale))}
            format={(v) => `$${formatUsdAmount(v)}`}
            height={140}
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
