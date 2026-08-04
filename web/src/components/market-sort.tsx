"use client";

import { useEffect, useState } from "react";

import type { MarketSortKey } from "@oxar/sdk";

import { CustomSelect } from "@/components/custom-select";
import { getTvlMap } from "@/lib/yield";
import { useT } from "@/lib/i18n";

/**
 * The sort control.
 *
 * It exists, and it starts on the catalog's own order. That's the whole
 * argument: a ranking the user picked is a question they asked, while a list
 * that arrives ranked is a recommendation we made — and a recommendation is
 * advice we aren't licensed to give.
 *
 * `withDeposited` is off for stocks and gold: their deposit figure is the size
 * of a tokenised wrapper, which means something different from a lending pool's
 * and can't be ranked in the same column.
 */
export function MarketSortSelect({
  value,
  onChange,
  withDeposited = true,
}: {
  value: MarketSortKey;
  onChange: (next: MarketSortKey) => void;
  withDeposited?: boolean;
}) {
  const { t } = useT();
  const options = [
    { value: "", label: t("sort.default") },
    { value: "name", label: t("sort.name") },
    { value: "position", label: t("sort.position") },
    ...(withDeposited ? [{ value: "deposited", label: t("sort.deposited") }] : []),
  ];

  return (
    <CustomSelect
      value={value}
      onChange={(v) => onChange(v as MarketSortKey)}
      options={options}
      className="shrink-0"
    />
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
