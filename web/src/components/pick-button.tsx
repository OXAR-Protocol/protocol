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
  block,
  blockOnMobile,
  className,
}: {
  picked: boolean;
  onToggle: () => void;
  /** For screen readers — which thing this picks. */
  label: string;
  /** Full width along the bottom of a card, instead of a chip in the corner. */
  block?: boolean;
  /** Full width on a phone, back to a chip once the row has width to spare. */
  blockOnMobile?: boolean;
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
      className={`cursor-pointer items-center gap-1 rounded-full border lowercase tracking-wide transition ${
        // Three shapes for one control. A card always gives it the bottom edge, so
        // every card in a row of them ends the same way. A LIST row only has width
        // to spare on a wide screen — on a phone the control drops under the row,
        // on a desktop it sits back at the right where the eye already goes.
        block
          ? "flex w-full justify-center px-4 py-2 text-[12px]"
          : blockOnMobile
            ? "flex w-full justify-center px-4 py-2 text-[12px] sm:inline-flex sm:w-auto sm:shrink-0 sm:px-2.5 sm:py-1 sm:text-[11px]"
            : "inline-flex shrink-0 px-2.5 py-1 text-[11px]"
      } ${
        picked
          ? "border-black bg-black text-white"
          : "border-black/15 bg-white/80 text-black/50 hover:border-black/40 hover:text-black"
      } ${className ?? ""}`}
    >
      {picked ? <Check size={11} strokeWidth={2.5} /> : <Plus size={11} strokeWidth={2.5} />}
      {/* Always the words. The icon-only variant this used to have on a phone said
       *  nothing about what tapping it would do; the rows make room instead. */}
      <span>{picked ? t("bulk.picked") : t("bulk.pick")}</span>
    </span>
  );
}
