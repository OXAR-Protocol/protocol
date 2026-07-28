import { describe, it, expect } from "vitest";

import {
  groupByDay,
  activeDays,
  takeByEventCount,
  summarizeDays,
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

  it("attaches the value series and measures the day-on-day change", () => {
    const days = groupByDay(
      [],
      [
        { t: at(DAY, 23), usd: 100 },
        { t: at(DAY + SECONDS_PER_DAY, 23), usd: 130 },
      ],
    );
    expect(days[0]!.usd).toBe(130);
    expect(days[0]!.changeUsd).toBe(30);
    // The first day has nothing to compare against — not a 100-dollar gain.
    expect(days[1]!.changeUsd).toBeNull();
  });

  // A hole in the price series must not read as a crash to zero and a recovery.
  it("compares against the last day that HAD a value, not the calendar day before", () => {
    const days = groupByDay(
      [ev(at(DAY + SECONDS_PER_DAY), "buy", 1)],
      [
        { t: at(DAY, 23), usd: 100 },
        { t: at(DAY + 2 * SECONDS_PER_DAY, 23), usd: 120 },
      ],
    );
    const gap = days.find((d) => d.day === DAY + SECONDS_PER_DAY)!;
    expect(gap.usd).toBeNull();
    expect(gap.changeUsd).toBeNull();
    expect(days[0]!.changeUsd).toBe(20);
  });

  it("has no rows at all when there is nothing to say", () => {
    expect(groupByDay([], [])).toEqual([]);
  });
});

describe("summarizeDays", () => {
  const days = groupByDay(
    [ev(at(DAY, 9), "buy", 40), ev(at(DAY + SECONDS_PER_DAY, 9), "sell", 10)],
    [
      { t: at(DAY, 23), usd: 200 },
      { t: at(DAY + SECONDS_PER_DAY, 23), usd: 250 },
    ],
  );

  it("measures the range end to end", () => {
    const s = summarizeDays(days);
    expect(s.startUsd).toBe(200);
    expect(s.endUsd).toBe(250);
    expect(s.changeUsd).toBe(50);
    expect(s.changePct).toBeCloseTo(0.25);
  });

  it("counts the flows and the days they happened on", () => {
    const s = summarizeDays(days);
    expect(s.inUsd).toBe(40);
    expect(s.outUsd).toBe(10);
    expect(s.trades).toBe(2);
    expect(s.activeDays).toBe(2);
  });

  it("refuses a percentage when there was nothing to grow from", () => {
    const fromZero = groupByDay([], [
      { t: at(DAY, 23), usd: 0 },
      { t: at(DAY + SECONDS_PER_DAY, 23), usd: 50 },
    ]);
    const s = summarizeDays(fromZero);
    expect(s.changeUsd).toBe(50);
    expect(s.changePct).toBeNull();
  });

  it("reports nothing rather than zero when there are no values", () => {
    const s = summarizeDays(groupByDay([ev(at(DAY), "buy", 5)], []));
    expect(s.startUsd).toBeNull();
    expect(s.changeUsd).toBeNull();
    expect(s.trades).toBe(1);
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

  // The filtering must not reach the arithmetic: a quiet stretch still moved the
  // value, and the range summary has to account for it.
  it("does not change what the range summary measures", () => {
    const days = groupByDay(
      [ev(at(DAY, 9), "buy", 10)],
      [
        { t: at(DAY, 23), usd: 100 },
        { t: at(DAY + 2 * SECONDS_PER_DAY, 23), usd: 130 },
      ],
    );
    expect(summarizeDays(days).changeUsd).toBe(30);
    expect(summarizeDays(activeDays(days)).changeUsd).not.toBe(30);
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
