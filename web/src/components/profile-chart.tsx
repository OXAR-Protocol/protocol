"use client";

import {
  formatUsdAmount,
  formatSignedUsd,
  formatDayShort,
  type PerformanceDay,
  type RangePerformance,
} from "@oxar/sdk";

import { AnimatedAmount } from "@/components/animated-amount";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverChart } from "@/components/hover-chart";
import { RANGES, type Range } from "@/lib/history-range";
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
  neverFunded,
  periodLabel,
}: {
  points: PerformanceDay[];
  performance: RangePerformance | null;
  range: Range;
  onRangeChange: (r: Range) => void;
  loading: boolean;
  locale: string;
  /** Nothing has ever been held here — see `PerformanceStats`. Zero, not a dash. */
  neverFunded?: boolean;
  /** The period the figure beside the total actually covers — see `ProfileMoney`. */
  periodLabel: string;
}) {
  const { t } = useT();

  // Days before the first dollar arrived are not history, they are the absence of
  // it — and drawing them pins the whole line to the floor, because the range then
  // runs from an empty wallet to a full one. A gain of a cent on ten dollars looked
  // like a flat line along the bottom for exactly this reason.
  const firstFunded = points.findIndex((p) => p.usd > 0.005);
  const drawn = firstFunded > 0 ? points.slice(firstFunded) : points;
  const now = points.length ? points[points.length - 1]!.usd : 0;
  const earned = performance?.earnedUsd ?? null;
  const up = earned === null || earned >= 0;

  return (
    <section data-tour="balance">
      <p className="text-[11px] lowercase tracking-wide text-ink/40">{t("profile.allTogether")}</p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          {/* The headline figure on the page, and it used to change by being replaced:
              one frame it says $0.00, the next it says $1,234.56. Animating it per
              character is the difference between reading a new number and watching
              your own number arrive. */}
          <p className="text-[clamp(30px,6vw,44px)] font-light leading-none tracking-[-0.02em] tabular-nums text-ink">
            $<AnimatedAmount value={formatUsdAmount(now)} />
          </p>
          <p className={`whitespace-nowrap text-[13px] tabular-nums ${up ? "text-profit" : "text-loss"}`}>
            {earned === null ? (neverFunded ? "$0.00" : "—") : formatSignedUsd(earned)}
            <span className="text-ink/40"> · {periodLabel}</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`rounded-full px-2.5 py-1 text-[11px] lowercase tracking-wide transition ${
                range === r ? "bg-ink text-paper" : "bg-ink/[0.05] text-ink/55 hover:text-ink"
              }`}
            >
              {t(`history.range.${r}` as "history.range.7")}
            </button>
          ))}
        </div>
      </div>

      {/* Full-bleed on a phone: the page's own padding stops at the chart's edge. The
          dot field lives here and nowhere else — behind data it reads as graph paper,
          everywhere else it was just wallpaper. */}
      <div className="dot-field mt-4 -mx-5 sm:mx-0">
        {loading ? (
          // The height was already reserved, so nothing jumped here — but a spinner
          // still says "wait" where a shape can say "a chart is coming", which is the
          // same information without the pause in it.
          <Skeleton className="mx-5 h-[150px] rounded-panel sm:mx-0" />
        ) : drawn.length > 1 ? (
          <HoverChart
            values={drawn.map((p) => p.usd)}
            labels={drawn.map((p) => formatDayShort(p.t, locale))}
            format={(v) => `$${formatUsdAmount(v)}`}
            height={150}
            className={up ? "text-profit" : "text-loss"}
            fill
          />
        ) : (
          // Nothing yet is a state, not an absence: a flat line at zero shows where
          // the money will be drawn and keeps the screen the same height it will be
          // tomorrow. A sentence in the middle of blank space reads as a broken chart.
          <div className="relative">
            <HoverChart
              values={[0, 0]}
              labels={["", ""]}
              format={(v) => `$${formatUsdAmount(v)}`}
              height={150}
              className="text-ink/15"
            />
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] text-ink/30">
              {t("history.noChart")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
