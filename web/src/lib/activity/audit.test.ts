import { describe, it, expect } from "vitest";
import { groupByDay, summarizeDays, activeDays } from "@oxar/sdk";

const DAY = 1_773_273_600;
const D = 86_400;

// A realistic little history: fund, buy, hold through a price move, sell some.
describe("numbers agree between the chart, the summary and the day list", () => {
  const points = [
    { t: DAY + D - 1, usd: 0 },
    { t: DAY + 2 * D - 1, usd: 100 },
    { t: DAY + 3 * D - 1, usd: 112 },
    { t: DAY + 4 * D - 1, usd: 90 },
  ];
  const events = [
    { timestamp: DAY + D + 100, kind: "buy", usd: 100 },
    { timestamp: DAY + 3 * D + 100, kind: "sell", usd: 25 },
  ];
  const days = groupByDay(events, points);
  const stats = summarizeDays(days);

  it("the last day's value is what the chart's last point draws", () => {
    expect(days[0]!.usd).toBe(points[points.length - 1]!.usd);
    expect(stats.endUsd).toBe(90);
  });

  it("the day-on-day changes sum to the range change", () => {
    const summed = days.reduce((n, d) => n + (d.changeUsd ?? 0), 0);
    expect(summed).toBeCloseTo(stats.changeUsd!, 8);
  });

  it("in and out match the events, not the value moves", () => {
    expect(stats.inUsd).toBe(100);
    expect(stats.outUsd).toBe(25);
    expect(stats.trades).toBe(2);
  });

  it("filtering quiet days out of the LIST leaves the summary untouched", () => {
    expect(activeDays(days)).toHaveLength(2);
    expect(summarizeDays(days).changeUsd).toBe(90);
  });
});
