"use client";

import { useMemo } from "react";

import { groupByDay, countActivity, activeDays, utcDayStart, type PerformanceDay } from "@oxar/sdk";

import { useActivity } from "@/hooks/use-activity";

/**
 * The wallet's moves, read as days over exactly the stretch a value series covers.
 *
 * The window comes from the series, not the clock: it is by definition the stretch
 * the chart is drawing, so a list and a line on the same screen cannot disagree
 * about what "30 days" means. Two screens now show this pair, which is why the
 * grouping lives here rather than in either of them.
 */
export function useDayActivity(seriesDays: PerformanceDay[]) {
  // Deep enough for a year of ordinary use; the route caps it.
  const { events, loading } = useActivity(500);

  const days = useMemo(() => {
    const cutoff = seriesDays.length ? utcDayStart(seriesDays[0]!.t) : 0;
    return groupByDay(events.filter((e) => e.timestamp >= cutoff), seriesDays);
  }, [events, seriesDays]);

  // Counts read EVERY day; the list shows only the ones something happened on. A
  // quiet day repeats what the chart already draws, and there is one per calendar
  // day — pages of "$0.00" rows burying the few that record a decision.
  return {
    days,
    counts: useMemo(() => countActivity(days), [days]),
    listedDays: useMemo(() => activeDays(days), [days]),
    loading,
  };
}
