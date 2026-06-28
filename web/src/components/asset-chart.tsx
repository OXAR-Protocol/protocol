"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { HoverChart } from "@/components/hover-chart";
import { getCached, setCache } from "@/lib/cache";

const RANGES = ["24h", "7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

/** Price chart with a range switcher (24h / 7d / 30d / 90d) for a held asset.
 *  Fetches closes on demand from /api/asset-chart (Jupiter datapi). */
export function AssetChart({ mint }: { mint: string }) {
  const [range, setRange] = useState<Range>("24h");
  const [closes, setCloses] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `asset-chart:${mint}:${range}`;
    const cached = getCached<number[]>(cacheKey);
    if (cached) {
      setCloses(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/asset-chart?mint=${mint}&range=${range}`)
      .then((r) => r.json())
      .then((j) => {
        const c = (j?.closes ?? []) as number[];
        if (!cancelled) {
          setCloses(c);
          setCache(cacheKey, c);
        }
      })
      .catch(() => {
        if (!cancelled) setCloses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mint, range]);

  const first = closes[0];
  const last = closes[closes.length - 1];
  const changePct = first && last && first > 0 ? ((last - first) / first) * 100 : null;
  const up = (changePct ?? 0) >= 0;
  const lo = closes.length > 1 ? Math.min(...closes) : null;
  const hi = closes.length > 1 ? Math.max(...closes) : null;

  return (
    <div className="p-5 rounded-[12px] border border-black/10">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-col gap-1">
          {changePct !== null && (
            <span className={`text-[13px] tabular-nums ${up ? "text-emerald-600" : "text-red-600"}`}>
              {up ? "+" : ""}
              {changePct.toFixed(2)}% · {range}
            </span>
          )}
          {lo !== null && hi !== null && (
            <span className="text-[11px] tabular-nums text-black/40">
              ${lo.toFixed(2)} – ${hi.toFixed(2)} range
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded-[4px] text-[10px] lowercase tracking-wide transition ${
                range === r
                  ? "border border-black/30 text-black"
                  : "border border-transparent text-black/45 hover:text-black/70"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 flex items-center justify-center">
        {loading ? (
          <Loader2 className="animate-spin text-black/40" size={18} />
        ) : closes.length > 1 ? (
          <HoverChart
            values={closes}
            height={220}
            fill
            format={(v) => `$${v.toFixed(2)}`}
            className={up ? "text-emerald-500/80" : "text-red-500/80"}
          />
        ) : (
          <p className="text-xs text-black/40">No price history for this range.</p>
        )}
      </div>
    </div>
  );
}
