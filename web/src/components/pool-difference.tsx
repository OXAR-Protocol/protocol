"use client";

import { compactUsd } from "@oxar/sdk";

import { useTvlMap } from "@/components/market-sort";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { useT } from "@/lib/i18n";

/** Rates this close are the same rate as far as a decision goes. */
const SAME_RATE = 0.005; // half a percentage point

/**
 * Why one of these and not the other.
 *
 * The picker above shows the same product in two or three currencies with a rate
 * beside each, which answers the question only while the rates differ. When they
 * match — and on the same protocol they usually do — the app went quiet and left
 * people to guess, or to assume there was no difference at all. There is one, it
 * just isn't a percentage: how big the pool is, and which dollar you end up holding.
 */
export function PoolDifference({ variants, selectedId }: { variants: ProviderView[]; selectedId: string }) {
  const { t } = useT();
  const tvl = useTvlMap();

  if (variants.length < 2) return null;
  const apys = variants.map((v) => v.apy);
  const sameRate = Math.max(...apys) - Math.min(...apys) < SAME_RATE;

  const sized = variants
    .map((v) => ({ v, usd: tvl[v.defiLlamaPoolId ?? ""] ?? 0 }))
    .filter((r) => r.usd > 0)
    .sort((a, b) => b.usd - a.usd);

  return (
    <div className="mt-4 max-w-[52ch] rounded-control border border-ink/[0.08] bg-ink/[0.02] p-3">
      <p className="text-[12px] leading-relaxed text-ink/55">
        {t(sameRate ? "pool.sameRate" : "pool.rateAside")}
      </p>
      {sized.length > 1 && (
        <ul className="mt-2 space-y-0.5">
          {sized.map(({ v, usd }) => (
            <li
              key={v.id}
              className={`text-[12px] tabular-nums ${v.id === selectedId ? "text-ink" : "text-ink/45"}`}
            >
              {v.assetSymbol} — {t("pool.inPool", { usd: compactUsd(usd) })}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-ink/40">{t("pool.sizeMeans")}</p>
    </div>
  );
}
