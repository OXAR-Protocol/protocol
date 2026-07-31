"use client";

import { Check, Plus } from "lucide-react";

import { useT } from "@/lib/i18n";

/**
 * The one control for adding something to a set — used by the portfolio list, the
 * portfolio cards and the browse list. It was written three times before this;
 * three copies of "picked looks like X" is three chances for them to disagree.
 */
export function PickButton({
  picked,
  onToggle,
  label,
  compact,
  className,
}: {
  picked: boolean;
  onToggle: () => void;
  /** For screen readers — which thing this picks. */
  label: string;
  /** Icon only until there's room for words. In a position row the full label is
   *  wider than the name beside it, so on a phone the name lost. */
  compact?: boolean;
  className?: string;
}) {
  const { t } = useT();
  return (
    <span
      role="checkbox"
      aria-checked={picked}
      aria-label={label}
      data-tour="multi-add"
      tabIndex={0}
      onClick={(e) => {
        // The row or card navigates; picking must not.
        e.stopPropagation();
        onToggle();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      }}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] lowercase tracking-wide transition ${
        picked
          ? "border-black bg-black text-white"
          : "border-black/15 bg-white/80 text-black/50 hover:border-black/40 hover:text-black"
      } ${className ?? ""}`}
    >
      {picked ? <Check size={11} strokeWidth={2.5} /> : <Plus size={11} strokeWidth={2.5} />}
      <span className={compact ? "hidden sm:inline" : undefined}>
        {picked ? t("bulk.picked") : t("bulk.pick")}
      </span>
    </span>
  );
}
