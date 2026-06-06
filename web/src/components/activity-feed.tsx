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
      <div className="border border-white/10 rounded-[8px] p-6 text-center">
        <Loader2 className="animate-spin inline text-white/30" size={18} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="border border-white/10 rounded-[8px] p-6 text-center">
        <p className="font-mono text-sm text-white/40">
          Nothing yet — your money is still snoring.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-[8px] divide-y divide-white/[0.06]">
      {events.map((e, i) => {
        const inflow = INFLOW.includes(e.kind);
        const Icon = inflow ? ArrowDownLeft : ArrowUpRight;
        return (
          <a
            key={e.signature || i}
            href={`https://solscan.io/tx/${e.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 p-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                size={15}
                strokeWidth={1.5}
                className={inflow ? "text-emerald-400/70" : "text-white/40"}
              />
              <span className="font-sans text-sm text-white truncate">{e.label}</span>
            </div>
            <div className="flex items-baseline gap-3 shrink-0">
              {e.usd !== null && (
                <span className="font-mono text-sm text-white/80 tabular-nums">
                  ${e.usd.toFixed(2)}
                </span>
              )}
              <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
                {timeAgo(e.timestamp)}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
