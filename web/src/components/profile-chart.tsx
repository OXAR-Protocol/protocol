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
  split,
  chrome,
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
  /** The working / free-to-use split, rendered by the caller so this stays
   *  presentational. See `MoneySplit`. */
  split?: React.ReactNode;
  /** The account control, rendered opposite the balance. See `ProfileHeader`. */
  chrome?: React.ReactNode;
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
  const rangeLabel = t(`history.range.${range}` as "history.range.7");

  return (
    <section data-tour="balance">
      {/* No label above it any more. On a screen about money a figure this size does
          not need to be told it is money, and "everything, all together" was a caption
          explaining the obvious directly above the obvious.

          This is now the h1 of the page. It used to sit fourth, under the wallet
          address, the badge and a row of facts — so the one number people open this
          screen for was the one thing they had to scroll past an identifier to reach.
          Banks lead with the balance. */}
      <div className="flex items-start justify-between gap-4">
        {/* Column on a phone, row once there's room. This was `flex-wrap` at every
            width, so the change sat beside the total or dropped below it depending on
            how many characters it happened to have: "−$1.13 · 7 days" fit, "−$41.27 ·
            30 days" didn't, and switching range shunted the whole chart down a line.
            A layout that depends on the value is a layout that jumps. */}
        <div className="flex min-w-0 flex-col items-baseline gap-x-3 gap-y-1 sm:flex-row">
          {/* It used to change by being replaced: one frame $0.00, the next $1,234.56.
              Animating it per character is the difference between reading a new number
              and watching your own number arrive. */}
          <h1 className="text-[clamp(34px,8vw,54px)] font-light leading-none tracking-[-0.03em] tabular-nums text-ink">
            $<AnimatedAmount value={formatUsdAmount(now)} />
          </h1>
          <p className={`whitespace-nowrap text-[13px] tabular-nums ${up ? "text-profit" : "text-loss"}`}>
            {earned === null ? (neverFunded ? "$0.00" : "—") : formatSignedUsd(earned)}
            {/* The active range chip sits right underneath saying the same word, so the
                period is only worth repeating when the two disagree — a wallet younger
                than the range, where this reads "since start" instead. */}
            {periodLabel !== rangeLabel && <span className="text-ink/40"> · {periodLabel}</span>}
          </p>
        </div>

        {/* Opposite the balance, where a bank puts your face: the account, and the
            way into it. It used to sit a whole row higher, above a greeting. */}
        {chrome}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRangeChange(r)}
            className={`rounded-full px-2.5 py-1 text-[11px] lowercase tracking-wide transition active:scale-[0.97] ${
              range === r ? "bg-ink text-paper" : "bg-ink/[0.05] text-ink/55 hover:text-ink"
            }`}
          >
            {t(`history.range.${r}` as "history.range.7")}
          </button>
        ))}
      </div>

      {/* "How much do I have" and "how much can I spend" are asked one after the
          other, so they are answered one after the other. Both figures were already
          computed — they just lived in a card below the chart, which is after the
          analytics and after the fold. */}
      {split}

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
