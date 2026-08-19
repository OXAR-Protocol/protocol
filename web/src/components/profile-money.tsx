"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { ProfileChart } from "@/components/profile-chart";
import { PerformanceStats } from "@/components/performance-stats";
import { PositionsSection } from "@/components/positions-section";
import { DayHistory } from "@/components/day-history";
import { usePortfolioHistory } from "@/hooks/use-portfolio-history";
import { useDayActivity } from "@/hooks/use-day-activity";
import { type Range } from "@/lib/history-range";
import { useT } from "@/lib/i18n";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

/**
 * The money half of your own page, in the order the questions come: what is it all
 * worth, what did that come to, what is it made of, and what did I do to get here.
 *
 * This was a whole second page — the portfolio — showing the same chart, the same
 * positions and the same history one level of detail apart. Two screens for one
 * object meant every change had to be made twice and they still drifted; the
 * shared day grouping was the first symptom. Now the portfolio IS this, and /you
 * is where you look at your money.
 *
 * One fetch of the value series feeds all of it — the chart draws it, the figures
 * sum it, the day list takes its window from it — so nothing on screen can be
 * describing a different month than its neighbour.
 */
export function ProfileMoney({ wallet }: { wallet: React.ReactNode }) {
  const { t, locale } = useT();
  const [range, setRange] = useState<Range>(30);
  const history = usePortfolioHistory(range);
  const { counts, listedDays, loading: loadingDays } = useDayActivity(history.days);

  // An account that has never held anything. Every figure on this screen is then
  // genuinely zero, and showing dashes made an empty portfolio look broken rather
  // than empty — "is my money even here?" was the actual report.
  const neverFunded =
    !history.loading && history.days.length > 0 && history.days.every((d) => d.usd <= 0.005);

  return (
    <>
      {/* Two columns from `lg`: the chart takes the width it deserves and the money
          panel fills what used to be empty margin. Below that everything is full
          width, because a table squeezed into two thirds is a worse table. */}
      <motion.div {...rise(0.05)} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
        <ProfileChart
          points={history.days}
          performance={history.performance}
          range={range}
          onRangeChange={setRange}
          loading={history.loading}
          locale={locale}
          neverFunded={neverFunded}
        />
        <div className="mt-5">
          <PerformanceStats
            performance={history.performance}
            heldMints={history.heldMints}
            counts={counts}
            range={range}
            neverFunded={neverFunded}
          />
        </div>
        </div>

        {wallet}
      </motion.div>

      {/* No heading: the rows are self-evidently what you hold, and "what it's made
          of" was a label explaining a list that explains itself. */}
      <motion.section {...rise(0.1)} className="mt-10">
        <PositionsSection />
      </motion.section>

      <motion.section {...rise(0.15)} className="mt-10" data-tour="history">
        <p className="mb-3 text-xs lowercase tracking-[0.2em] text-ink/40">{t("pile.history")}</p>
        {loadingDays ? (
          <div className="flex justify-center py-10 text-ink/25">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : (
          <DayHistory days={listedDays} locale={locale} />
        )}
      </motion.section>
    </>
  );
}
