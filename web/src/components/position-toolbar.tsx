"use client";

import { List, LayoutGrid } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { isPriceExposure } from "@/lib/yield/assets";
import { isXStock } from "@/lib/yield/xstocks";
import { isGold } from "@/lib/yield/gold";
import { useT } from "@/lib/i18n";

export type Layout = "list" | "grid";
/**
 * Narrow the position list — by what a thing IS, which is the only axis a person can
 * act on here. There was a "traded" chip too; it meant "you have an event on this in
 * the recent feed", which is not a property of the asset, not a question anyone asks
 * of their own positions, and — reported by a user — not guessable from the word.
 */
export type Filter = "all" | "yield" | "stocks" | "gold";

const FILTERS = ["all", "yield", "stocks", "gold"] as const;

interface Props {
  /** Every held position — decides which controls are worth offering at all. */
  allHeld: ProviderView[];
  filter: Filter;
  onFilter: (f: Filter) => void;
  layout: Layout;
  onLayout: (l: Layout) => void;
  /** Say the multi-select exists; it was discoverable only by noticing a small
   *  control on hover, which is the same as not existing. */
  showPickHint: boolean;
}

/** The controls above the position list: how to slice it, and how to look at it.
 *  Each is offered only when it has something to do — a single position needs no
 *  filter, and an empty portfolio needs no layout switch. */
export function PositionToolbar({ allHeld, filter, onFilter, layout, onLayout, showPickHint }: Props) {
  const { t } = useT();

  const offered = FILTERS.filter((f) => {
    if (f === "all") return true;
    if (f === "stocks") return allHeld.some((v) => isXStock(v.id));
    if (f === "gold") return allHeld.some((v) => isGold(v.id));
    return allHeld.some((v) => !isPriceExposure(v.id));
  });

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs lowercase tracking-[0.2em] text-black/40">{t("pile.positions")}</p>
        {allHeld.length > 0 && (
          <div className="flex gap-1">
            {(
              [
                ["list", List],
                ["grid", LayoutGrid],
              ] as const
            ).map(([mode, Icon]) => (
              <button
                key={mode}
                onClick={() => onLayout(mode)}
                aria-label={`${mode} view`}
                className={`rounded-[5px] border p-1.5 transition ${
                  layout === mode
                    ? "border-black/30 text-black"
                    : "border-black/10 text-black/45 hover:text-black/70"
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
              </button>
            ))}
          </div>
        )}
      </div>

      {showPickHint && (
        <p className="mb-2 text-[11px] lowercase tracking-wide text-black/35">{t("bulk.hint")}</p>
      )}

      {allHeld.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {offered.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFilter(f)}
              className={`rounded-full px-3 py-1 text-[11px] lowercase tracking-wide transition ${
                filter === f ? "bg-black text-white" : "bg-black/[0.05] text-black/55 hover:text-black"
              }`}
            >
              {t(`pile.filter.${f}` as "pile.filter.all")}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
