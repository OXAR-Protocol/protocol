"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import {
  isDustUsd,
  takeByEventCount,
  formatDay,
  formatTimeOfDay,
  formatUsdAmount,
  formatSignedUsd,
  utcDayStart,
  type DayActivity,
} from "@oxar/sdk";

import type { ActivityEvent } from "@/lib/activity/parse";
import { useT } from "@/lib/i18n";

/** Which way the money went, from the holder's point of view. */
const INFLOW = new Set(["sell", "withdraw", "receive"]);

/**
 * History read as days rather than as a stream.
 *
 * A feed answers "what happened last". It can't answer "what did I do that week" or
 * "why is my total below yesterday's" — both are day-shaped. So each day carries what
 * the portfolio closed at, how that moved, and the transactions underneath it.
 *
 * Dates are absolute, in UTC. "3d ago" can't be checked against a bank statement, and
 * reading the timestamps in the viewer's zone would put a late-evening trade on a
 * different row than the day it was counted in.
 */
/** How many transactions each "show more" adds. A history is skimmed, not read. */
const PAGE = 20;
/** What opens: the latest day, alone. `takeByEventCount` never splits a day, so any
 *  limit below the newest day's transaction count resolves to exactly that day —
 *  the answer to "what happened today", with the rest a tap away rather than a
 *  wall of past weeks under a page you came to for something else. */
const FIRST = 1;

export function DayHistory({ days, locale }: { days: DayActivity<ActivityEvent>[]; locale: string }) {
  const { t } = useT();
  const [limit, setLimit] = useState(FIRST);
  // Read the clock after mount, not during render: the date is cosmetic (it only
  // decides whether the newest row says "today" or its date), and reading it in
  // render makes this component impure for no benefit.
  const [today, setToday] = useState(0);
  useEffect(() => setToday(utcDayStart(Date.now() / 1000)), []);

  if (days.length === 0) {
    return (
      <div className="rounded-[12px] border border-black/10 bg-white p-8 text-center text-[13px] text-black/45">
        {t("activity.empty")}
      </div>
    );
  }

  const { shown, remaining } = takeByEventCount(days, limit);

  return (
    <div className="space-y-3">
      {shown.map((d) => (
        <div key={d.day} className="rounded-[12px] border border-black/10 bg-white">
          {/* The day itself: what it closed at, and how that moved. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-black/[0.06] px-4 py-3">
            <span className="text-[13px] text-black">
              {d.day === today ? t("history.today") : formatDay(d.day, locale)}
            </span>
            <span className="flex items-baseline gap-2 tabular-nums">
              {d.usd !== null && (
                <span className="text-[13px] text-black/70">${formatUsdAmount(d.usd)}</span>
              )}
              {/* What the day EARNED, not how its total moved: on a day money went in,
                  the second number is mostly the deposit and reads as profit. */}
              {d.earnedUsd !== null && !isDustUsd(Math.abs(d.earnedUsd)) && (
                <span className={`text-[12px] ${d.earnedUsd >= 0 ? "text-black/45" : "text-red-600"}`}>
                  {formatSignedUsd(d.earnedUsd)}
                </span>
              )}
            </span>
          </div>

          {/* What was done that day. A day can have a value and no transactions —
              that's a day the market moved, which is worth seeing on its own. */}
          {d.events.length > 0 && (
            <div className="divide-y divide-black/[0.06]">
              {d.events.map((e) => {
                const inflow = INFLOW.has(e.kind);
                return (
                  <a
                    key={e.signature}
                    href={`https://solscan.io/tx/${e.signature}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-black/[0.02]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-black/45">
                      {inflow ? (
                        <ArrowDownLeft size={12} strokeWidth={2} />
                      ) : (
                        <ArrowUpRight size={12} strokeWidth={2} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-black">{e.label}</span>
                      {e.units !== undefined && (
                        <span className="block text-[11px] tabular-nums text-black/40">
                          {e.units} {e.unitPriceUsd !== undefined && `· $${formatUsdAmount(e.unitPriceUsd)} ${t("activity.each")}`}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      {e.usd !== null && (
                        <span className="block text-[13px] text-black/70">
                          {inflow ? "+" : "−"}${formatUsdAmount(e.usd)}
                        </span>
                      )}
                      <span className="block text-[11px] text-black/35">
                        {formatTimeOfDay(e.timestamp, locale)}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE)}
          className="w-full rounded-[12px] border border-black/10 bg-white py-3 text-[12px] lowercase tracking-wide text-black/55 transition hover:border-black/30 hover:text-black"
        >
          {t("activity.showMore")}
        </button>
      )}
    </div>
  );
}
