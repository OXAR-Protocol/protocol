"use client";

import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";

import { useActivity } from "@/hooks/use-activity";
import type { ActivityKind } from "@/lib/activity/parse";

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
export function ActivityFeed() {
  const { events, loading } = useActivity();

  if (loading) {
    return (
      <div className="border border-black/10 bg-white rounded-[12px] p-6 text-center">
        <Loader2 className="animate-spin inline text-black/40" size={18} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="border border-black/10 bg-white rounded-[12px] p-6 text-center">
        <p className="text-sm text-black/45">
          nothing yet — your money is still snoring.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-black/10 bg-white rounded-[12px] divide-y divide-black/[0.06]">
      {events.map((e, i) => {
        const inflow = INFLOW.includes(e.kind);
        const Icon = inflow ? ArrowDownLeft : ArrowUpRight;
        return (
          <a
            key={e.signature || i}
            href={`https://solscan.io/tx/${e.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 p-4 hover:bg-black/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                size={15}
                strokeWidth={1.5}
                className={inflow ? "text-emerald-600" : "text-black/40"}
              />
              <span className="text-sm text-black truncate">{e.label}</span>
            </div>
            <div className="flex items-baseline gap-3 shrink-0">
              {e.usd !== null && (
                <span className="text-sm text-black/60 tabular-nums">
                  ${e.usd.toFixed(2)}
                </span>
              )}
              <span className="text-[10px] lowercase tracking-wide text-black/45">
                {timeAgo(e.timestamp)}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
