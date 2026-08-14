"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { HoverChart } from "@/components/hover-chart";
import { useT } from "@/lib/i18n";
import { getCached, setCache } from "@/lib/cache";

const RANGES = ["24h", "7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

interface ChartPoint {
  /** Unix seconds. */
  t: number;
  close: number;
}

/**
 * When a point was, phrased for the range it sits in: a time within today, a day
 * and time across a week, a date across months.
 *
 * LOCAL time here, unlike the transaction history — that's a ledger, bucketed in UTC
 * so an evening trade can't land on the wrong day, but a price is a thing you watch
 * live and "14:00" should mean your two o'clock.
 */
function pointLabel(t: number, range: Range, locale: string): string {
  const d = new Date(t * 1000);
  if (range === "24h") {
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  }
  if (range === "7d") {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", hour12: false }).format(d);
  }
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
}

/** Price chart with a range switcher (24h / 7d / 30d / 90d) for a held asset.
 *  Fetches closes on demand from /api/asset-chart (Jupiter datapi). */
export function AssetChart({ mint }: { mint: string }) {
  const { locale } = useT();
  const [range, setRange] = useState<Range>("24h");
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `asset-chart:${mint}:${range}`;
    const cached = getCached<ChartPoint[]>(cacheKey);
    if (cached) {
      setPoints(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/asset-chart?mint=${mint}&range=${range}`)
      .then((r) => r.json())
      .then((j) => {
        const p = (j?.points ?? []) as ChartPoint[];
        if (!cancelled) {
          setPoints(p);
          setCache(cacheKey, p);
        }
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mint, range]);

  const closes = points.map((p) => p.close);
  const first = closes[0];
  const last = closes[closes.length - 1];
  const changePct = first && last && first > 0 ? ((last - first) / first) * 100 : null;
  const up = (changePct ?? 0) >= 0;
  const lo = closes.length > 1 ? Math.min(...closes) : null;
  const hi = closes.length > 1 ? Math.max(...closes) : null;

  return (
    // No card around it, like the one on your own page: the line IS the content, and
    // a border only draws a box around the thing you came to look at.
    <div data-tour="chart">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {changePct !== null && (
            <span className={`text-[13px] tabular-nums ${up ? "text-profit" : "text-loss"}`}>
              {up ? "+" : ""}
              {changePct.toFixed(2)}% · {range}
            </span>
          )}
          {lo !== null && hi !== null && (
            <span className="text-[11px] tabular-nums text-ink/40">
              ${lo.toFixed(2)} – ${hi.toFixed(2)} range
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {/* Same chips as the portfolio's, so a range reads the same wherever it is. */}
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-2.5 py-1 text-[11px] lowercase tracking-wide transition ${
                range === r ? "bg-ink text-paper" : "bg-ink/[0.05] text-ink/55 hover:text-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Full width on a phone — the page's padding stops at the chart's edge, and
          the dot field marks this band as the one place data is drawn. */}
      <div className="dot-field -mx-5 flex h-56 items-center justify-center sm:mx-0">
        {loading ? (
          <Loader2 className="animate-spin text-ink/40" size={18} />
        ) : closes.length > 1 ? (
          <HoverChart
            values={closes}
            labels={points.map((p) => pointLabel(p.t, range, locale))}
            height={220}
            fill
            format={(v) => `$${v.toFixed(2)}`}
            className={up ? "text-emerald-500/80" : "text-loss/80"}
          />
        ) : (
          <p className="text-xs text-ink/40">No price history for this range.</p>
        )}
      </div>
    </div>
  );
}
