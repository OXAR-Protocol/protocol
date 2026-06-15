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
    <div className="mb-6 p-4 rounded-[6px] border border-black/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <p className="text-[10px] lowercase tracking-wide text-black/40">Price</p>
          {changePct !== null && (
            <span className={`text-xs tabular-nums ${up ? "text-emerald-600" : "text-red-600"}`}>
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

      <div className="h-24 flex items-center justify-center">
        {loading ? (
          <Loader2 className="animate-spin text-black/40" size={18} />
        ) : closes.length > 1 ? (
          <Sparkline
            values={closes}
            height={96}
            className={`w-full h-24 ${up ? "text-emerald-400/60" : "text-red-400/60"}`}
          />
        ) : (
          <p className="text-xs text-black/40">No price history for this range.</p>
        )}
      </div>
    </div>
  );
}
