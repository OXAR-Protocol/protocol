"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Sparkline } from "@/components/sparkline";
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

  return (
    <div className="mb-6 p-4 rounded-[6px] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">Price</p>
          {changePct !== null && (
            <span className={`font-mono text-xs tabular-nums ${up ? "text-emerald-400/80" : "text-red-400/80"}`}>
              {up ? "+" : ""}
              {changePct.toFixed(2)}% · {range}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded-[4px] font-mono text-[10px] uppercase tracking-wide transition ${
                range === r
                  ? "border border-white/30 text-white"
                  : "border border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-24 flex items-center justify-center">
        {loading ? (
          <Loader2 className="animate-spin text-white/30" size={18} />
        ) : closes.length > 1 ? (
          <Sparkline
            values={closes}
            height={96}
            className={`w-full h-24 ${up ? "text-emerald-400/60" : "text-red-400/60"}`}
          />
        ) : (
          <p className="font-mono text-xs text-white/30">No price history for this range.</p>
        )}
      </div>
    </div>
  );
}
