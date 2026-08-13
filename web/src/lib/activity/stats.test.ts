import { describe, it, expect } from "vitest";

import {
  groupByDay,
  activeDays,
  takeByEventCount,
  countActivity,
  utcDayStart,
  isSameUtcDay,
  formatDay,
  formatDayShort,
  formatTimeOfDay,
  SECONDS_PER_DAY,
} from "@oxar/sdk";

// 2026-03-12T00:00:00Z
const DAY = 1_773_273_600;
const at = (day: number, hour = 12) => day + hour * 3600;

const ev = (timestamp: number, kind: string, usd: number | null) => ({ timestamp, kind, usd });

describe("utcDayStart", () => {
  it("floors to midnight UTC", () => {
    expect(utcDayStart(at(DAY, 0))).toBe(DAY);
    expect(utcDayStart(at(DAY, 23))).toBe(DAY);
    expect(utcDayStart(at(DAY, 24))).toBe(DAY + SECONDS_PER_DAY);
  });

  it("tells days apart across the boundary", () => {
    expect(isSameUtcDay(at(DAY, 1), at(DAY, 22))).toBe(true);
    expect(isSameUtcDay(at(DAY, 23), at(DAY + SECONDS_PER_DAY, 1))).toBe(false);
  });
});

describe("groupByDay", () => {
  it("carries the day's breakdown through, so a row can say what a minus was", () => {
    const days = groupByDay([ev(at(DAY), "buy", 10)], [
      { t: at(DAY, 23), usd: 100, earnedUsd: -21.4, marketUsd: -0.4, costUsd: -21 },
    ]);
    expect(days[0]!.earnedUsd).toBe(-21.4);
    // Cost dominates → the row calls it what it is: money spent swapping, not a
    // holding that fell.
    expect(Math.abs(days[0]!.costUsd!)).toBeGreaterThan(Math.abs(days[0]!.marketUsd!));
  });

  it("leaves the breakdown null when the series doesn't carry one", () => {
    const days = groupByDay([ev(at(DAY), "buy", 10)]);
    expect(days[0]!.marketUsd).toBeNull();
    expect(days[0]!.costUsd).toBeNull();
  });

  it("buckets events by day, newest day first, newest event first", () => {
    const days = groupByDay([
      ev(at(DAY, 9), "buy", 10),
      ev(at(DAY, 18), "buy", 20),
      ev(at(DAY + SECONDS_PER_DAY, 9), "sell", 5),
    ]);
    expect(days.map((d) => d.day)).toEqual([DAY + SECONDS_PER_DAY, DAY]);
    expect(days[1]!.events.map((e) => e.usd)).toEqual([20, 10]);
  });

  it("separates money in from money out", () => {
    const days = groupByDay([
      ev(at(DAY), "buy", 10),
      ev(at(DAY), "deposit", 5),
      ev(at(DAY), "sell", 3),
      ev(at(DAY), "withdraw", 2),
    ]);
    expect(days[0]!.inUsd).toBe(15);
    expect(days[0]!.outUsd).toBe(5);
  });

  it("ignores unpriced and unknown-kind events in the totals but still lists them", () => {
    const days = groupByDay([ev(at(DAY), "buy", null), ev(at(DAY), "mystery", 99)]);
    expect(days[0]!.inUsd).toBe(0);
    expect(days[0]!.outUsd).toBe(0);
    expect(days[0]!.events).toHaveLength(2);
  });

  // What a day earned is carried BY the series, not derived from it here: a day that
  // took in $100 and earned nothing moved its total by $100, and only one of those
  // two numbers is worth showing a person.
  it("attaches the value series and what each day earned", () => {
    const days = groupByDay(
      [],
      [
        { t: at(DAY, 23), usd: 100, earnedUsd: 0 },
        { t: at(DAY + SECONDS_PER_DAY, 23), usd: 130, earnedUsd: 4 },
      ],
    );
    expect(days[0]!.usd).toBe(130);
    expect(days[0]!.earnedUsd).toBe(4);
    // Rose $30 on the day, earned $4 of it — the rest was money added.
    expect(days[1]!.earnedUsd).toBe(0);
  });

  it("leaves a day the series doesn't reach saying nothing at all", () => {
    const days = groupByDay(
      [ev(at(DAY + SECONDS_PER_DAY), "buy", 1)],
      [
        { t: at(DAY, 23), usd: 100, earnedUsd: 1 },
        { t: at(DAY + 2 * SECONDS_PER_DAY, 23), usd: 120, earnedUsd: 2 },
      ],
    );
    const gap = days.find((d) => d.day === DAY + SECONDS_PER_DAY)!;
    expect(gap.usd).toBeNull();
    expect(gap.earnedUsd).toBeNull();
    expect(days[0]!.earnedUsd).toBe(2);
  });

  it("has no rows at all when there is nothing to say", () => {
    expect(groupByDay([], [])).toEqual([]);
  });
});

describe("countActivity", () => {
  const days = groupByDay(
    [ev(at(DAY, 9), "buy", 40), ev(at(DAY + SECONDS_PER_DAY, 9), "sell", 10)],
    [
      { t: at(DAY, 23), usd: 200, earnedUsd: 1 },
      { t: at(DAY + SECONDS_PER_DAY, 23), usd: 250, earnedUsd: 2 },
    ],
  );

  it("counts what was done and the days it was done on", () => {
    expect(countActivity(days)).toEqual({ trades: 2, activeDays: 2 });
  });

  // The feed is the right source for "how many times did I trade" and the wrong one
  // for "how much is that in dollars" — it prices an event by its USDC leg, so a
  // USDT-settled trade counts here and would have priced as nothing there.
  it("counts a trade it could not have priced", () => {
    const unpriced = groupByDay([{ timestamp: at(DAY, 9), kind: "buy", usd: null }], []);
    expect(countActivity(unpriced).trades).toBe(1);
  });

  it("counts nothing out of nothing", () => {
    expect(countActivity([])).toEqual({ trades: 0, activeDays: 0 });
  });
});

describe("date formatting", () => {
  it("formats in UTC so a late-evening transaction keeps its own day", () => {
    expect(formatDay(at(DAY, 23))).toBe("12 Mar 2026");
    expect(formatDayShort(at(DAY, 23))).toBe("12 Mar");
    expect(formatTimeOfDay(at(DAY, 23))).toBe("23:00");
  });
});

describe("activeDays", () => {
  it("keeps only the days something happened on", () => {
    const days = groupByDay(
      [ev(at(DAY, 9), "buy", 10)],
      [
        { t: at(DAY, 23), usd: 100 },
        { t: at(DAY + SECONDS_PER_DAY, 23), usd: 105 },
        { t: at(DAY + 2 * SECONDS_PER_DAY, 23), usd: 110 },
      ],
    );
    expect(days).toHaveLength(3);
    expect(activeDays(days).map((d) => d.day)).toEqual([DAY]);
  });

  // Filtering is a VIEW concern and must not reach the arithmetic: a quiet stretch
  // still had trades on the days around it.
  it("does not change what was counted", () => {
    const days = groupByDay(
      [ev(at(DAY, 9), "buy", 10)],
      [
        { t: at(DAY, 23), usd: 100, earnedUsd: 0 },
        { t: at(DAY + 2 * SECONDS_PER_DAY, 23), usd: 130, earnedUsd: 5 },
      ],
    );
    expect(days).toHaveLength(2);
    expect(countActivity(days).trades).toBe(1);
  });
});

describe("takeByEventCount", () => {
  // Minutes, not hours: 25 events an hour apart would spill into the next day and
  // the helper would silently build TWO days instead of one busy one.
  const busy = (day: number, n: number) =>
    groupByDay(Array.from({ length: n }, (_, i) => ev(day + i * 60, "buy", 1)))[0]!;

  it("counts transactions, not days", () => {
    const days = [busy(DAY + 2 * SECONDS_PER_DAY, 12), busy(DAY + SECONDS_PER_DAY, 5), busy(DAY, 9)];
    const { shown, remaining } = takeByEventCount(days, 20);
    // 12 + 5 = 17 is under the limit, so the third day is pulled in whole (26 total).
    expect(shown).toHaveLength(3);
    expect(remaining).toBe(0);
  });

  it("never splits a day", () => {
    const days = [busy(DAY + SECONDS_PER_DAY, 25), busy(DAY, 4)];
    const { shown, remaining } = takeByEventCount(days, 20);
    expect(shown).toHaveLength(1);
    expect(shown[0]!.events).toHaveLength(25); // shown whole, not truncated at 20
    expect(remaining).toBe(4);
  });

  it("reports what is left to show", () => {
    const days = [busy(DAY + SECONDS_PER_DAY, 20), busy(DAY, 7)];
    expect(takeByEventCount(days, 20).remaining).toBe(7);
    expect(takeByEventCount(days, 40).remaining).toBe(0);
  });

  it("handles an empty list", () => {
    expect(takeByEventCount([], 20)).toEqual({ shown: [], remaining: 0 });
  });
});
