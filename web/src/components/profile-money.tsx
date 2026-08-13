"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { ProfileChart } from "@/components/profile-chart";
import { ProfilePositions } from "@/components/profile-positions";
import { DayHistory } from "@/components/day-history";
import { type Range } from "@/components/portfolio-chart";
import { usePortfolioHistory } from "@/hooks/use-portfolio-history";
import { useDayActivity } from "@/hooks/use-day-activity";
import { useT } from "@/lib/i18n";

/**
 * The money half of your own page, in the order the questions come: what is it all
 * worth, what is it made of, and what did I do to get here.
 *
 * One fetch of the value series feeds all three — the chart draws it, the day list
 * takes its window from it, so nothing on screen can be describing a different
 * month than its neighbour.
 */
export function ProfileMoney() {
  const { t, locale } = useT();
  const [range, setRange] = useState<Range>(30);
  const history = usePortfolioHistory(range);
  const { listedDays, loading: loadingDays } = useDayActivity(history.days);

  return (
    <>
      <div className="mt-8">
        <ProfileChart
          points={history.days}
          performance={history.performance}
          range={range}
          onRangeChange={setRange}
          loading={history.loading}
          locale={locale}
        />
      </div>

      <section className="mt-10">
        <p className="mb-3 text-xs lowercase tracking-[0.2em] text-black/40">{t("profile.positionsLabel")}</p>
        <ProfilePositions />
      </section>

      <section className="mt-10">
        <p className="mb-3 text-xs lowercase tracking-[0.2em] text-black/40">{t("pile.history")}</p>
        {loadingDays ? (
          <div className="flex justify-center py-10 text-black/25">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : (
          <DayHistory days={listedDays} locale={locale} />
        )}
      </section>
    </>
  );
}
