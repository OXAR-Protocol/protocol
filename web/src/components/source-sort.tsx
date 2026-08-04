"use client";

import { useEffect, useState } from "react";

import { getTvlMap, type ProviderGroup } from "@/lib/yield";
import { pickTarget } from "@/lib/yield";
import { useT } from "@/lib/i18n";

/** `null` is the catalog's own order — deliberately the default. */
export type SourceSort = null | "deposited";

/**
 * Who decides what "best" means.
 *
 * Ordering the shelf by size would be us saying the biggest is the one to take.
 * Offering the sort and leaving it off by default makes it the user's question
 * instead of our answer — the same fact, asked for rather than pushed. That
 * distinction is the whole reason there is a toggle here and not a "popular"
 * badge on a row.
 */
export function SourceSortToggle({
  value,
  onChange,
}: {
  value: SourceSort;
  onChange: (next: SourceSort) => void;
}) {
  const { t } = useT();
  const active = value === "deposited";
  return (
    <button
      type="button"
      onClick={() => onChange(active ? null : "deposited")}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-[11px] lowercase tracking-wide transition ${
        active
          ? "border-black/30 text-black"
          : "border-black/10 text-black/45 hover:border-black/30 hover:text-black"
      }`}
    >
      {t("market.sortDeposited")}
    </button>
  );
}

/** TVL for every pool at once — one memoised fetch, the same the rows read. */
export function useTvlMap(): Record<string, number> {
  const [map, setMap] = useState<Record<string, number>>({});
  useEffect(() => {
    let cancelled = false;
    getTvlMap().then((m) => !cancelled && setMap(m));
    return () => {
      cancelled = true;
    };
  }, []);
  return map;
}

/**
 * Groups in the requested order. Sources with no deposit figure (stocks, gold —
 * see the note in `TrustLine`) keep the catalog's order at the end rather than
 * being ranked as zero, which would read as "nobody holds these".
 */
export function sortGroups(
  groups: readonly ProviderGroup[],
  sort: SourceSort,
  tvl: Record<string, number>,
): ProviderGroup[] {
  if (!sort) return [...groups];
  const sized: ProviderGroup[] = [];
  const unsized: ProviderGroup[] = [];
  for (const g of groups) {
    const poolId = pickTarget(g).defiLlamaPoolId;
    (poolId && tvl[poolId] ? sized : unsized).push(g);
  }
  sized.sort((a, b) => (tvl[pickTarget(b).defiLlamaPoolId!] ?? 0) - (tvl[pickTarget(a).defiLlamaPoolId!] ?? 0));
  return [...sized, ...unsized];
}
