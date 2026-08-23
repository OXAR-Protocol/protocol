"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";

import { formatUsdAmount, centPrecision, floorTo } from "@oxar/sdk";

import { useActivity } from "@/hooks/use-activity";
import type { ActivityKind } from "@/lib/activity/parse";
import { useT } from "@/lib/i18n";

/** USDC flowing IN (sell/withdraw/receive) points down-left; OUT (buy/deposit/send) up-right. */
const INFLOW: ActivityKind[] = ["sell", "withdraw", "receive"];

function timeAgo(unixSec: number): string {
  if (!unixSec) return "";
  const s = Math.max(0, Math.floor(Date.now() / 1000 - unixSec));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Recent on-chain activity, derived from the wallet's history. Replaces the old
 *  static "Nothing yet" placeholder with a real feed (links to Solscan). */
const PAGE = 10;

interface Props {
  /** Show only rows about this held asset — used on an asset's own page. */
  mint?: string;
  /** Ticker for the quantity line, e.g. "AVGOx". */
  unitLabel?: string;
}

export function ActivityFeed({ mint, unitLabel }: Props = {}) {
  const { events: all, loading } = useActivity();
  const { t } = useT();
  const [visible, setVisible] = useState(PAGE);
  const events = mint ? all.filter((e) => e.mint === mint) : all;

  if (loading) {
    return (
      <div className="border border-ink/10 bg-paper rounded-card p-6 text-center">
        <Loader2 className="animate-spin inline text-ink/40" size={18} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="border border-ink/10 bg-paper rounded-card p-6 text-center">
        <p className="text-sm text-ink/45">
          {t("activity.empty")}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-ink/[0.06] overflow-hidden rounded-card border border-ink/10 bg-paper">
      {events.slice(0, visible).map((e, i) => {
        const inflow = INFLOW.includes(e.kind);
        const Icon = inflow ? ArrowDownLeft : ArrowUpRight;
        return (
          <a
            key={e.signature || i}
            href={`https://solscan.io/tx/${e.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 p-4 hover:bg-ink/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                size={15}
                strokeWidth={1.5}
                className={inflow ? "text-profit" : "text-ink/40"}
              />
              <div className="min-w-0">
                <span className="block truncate text-sm text-ink">{e.label}</span>
                {/* What was actually traded. A dollar figure alone doesn't say what
                    you now own, or at what price it was bought. */}
                {e.units !== undefined && (
                  <span className="block text-[11px] tabular-nums text-ink/45">
                    {floorTo(e.units, e.unitPriceUsd ? centPrecision(e.unitPriceUsd) : 4)}
                    {unitLabel ? ` ${unitLabel}` : ""}
                    {e.unitPriceUsd !== undefined &&
                      ` · $${formatUsdAmount(e.unitPriceUsd)} ${t("activity.each")}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-3 shrink-0">
              {e.usd !== null && (
                <span className="text-sm text-ink/60 tabular-nums">
                  ${formatUsdAmount(e.usd)}
                </span>
              )}
              <span className="text-[10px] lowercase tracking-wide text-ink/45">
                {timeAgo(e.timestamp)}
              </span>
            </div>
          </a>
        );
      })}
      {events.length > visible && (
        <button
          onClick={() => setVisible((v) => v + PAGE)}
          className="w-full p-3.5 text-center text-xs lowercase tracking-wide text-ink/50 transition-colors hover:bg-ink/[0.04] hover:text-ink"
        >
          {t("activity.showMore")}
        </button>
      )}
    </div>
  );
}
