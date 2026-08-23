"use client";

import type { ReactNode } from "react";

import { BanknoteBg } from "@/components/banknote-bg";

interface Props {
  /** Seeds the banknote texture — same asset, same paper. */
  seed: string;
  onOpen: () => void;
  disabled?: boolean;
  /** Icon + name + whatever sits under it. */
  lead: ReactNode;
  /** Trend line. The slot is rendered even when there's no series, or a row
   *  without history would shift everything beside it out of line. */
  chart?: ReactNode;
  /** The number the row is read for, plus its label underneath. */
  figure: ReactNode;
  /** Omitted entirely (not hidden) when picking is off. */
  pick?: ReactNode;
  /** Anything after the pick control — an "opens" arrow, say. */
  trailing?: ReactNode;
  /** In the basket: the row itself says so, not only the pill. */
  selected?: boolean;
}

/**
 * The shell every marketplace row shares. A stock, a yield source and a grouped
 * protocol are the same species, so they get one layout instead of three copies
 * that drift apart.
 *
 * On a phone the figure and the pick control stack into a single right-hand
 * cluster: side by side they ate ~230px of a 390px screen, the name had nowhere
 * left to go, and the ticker ran under the price. Stacking buys back the width
 * without taking the words off the button — a bare "+" doesn't say what it does.
 */
export function MarketRow({
  seed,
  onOpen,
  disabled,
  lead,
  chart,
  figure,
  pick,
  trailing,
  selected,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      // A floor on the height, so a list of them is a list and not a staircase: some
      // rows carry a subtitle, a unit count or a "since you bought" line and some
      // carry none, and left to the content each row was a different size. The floor
      // is the tall version's height — short rows grow into it, tall ones are unaffected.
      className={`group relative isolate flex min-h-[104px] w-full flex-wrap items-center gap-3 overflow-hidden rounded-field border bg-paper p-5 text-left transition-colors disabled:opacity-50 ${
        selected ? "border-ink/40 ring-1 ring-ink/10" : "border-ink/10 hover:border-ink/30"
      }`}
    >
      <BanknoteBg seed={seed} />

      <div className="min-w-0 flex-1">{lead}</div>

      <div className="hidden w-[140px] shrink-0 sm:block">{chart}</div>

      {/* A floor, not a cap, from `sm` up: it lines the figures up down the list,
          while a longer label underneath ("… since you bought") takes the width it
          needs instead of wrapping into a ragged stack. The trailing mark rides with
          it — on its own after a wrapped control it read as a stray glyph. */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right sm:min-w-[112px]">{figure}</div>
        {trailing}
      </div>

      {/* Wraps rather than stacks: on a phone it takes the full width and drops to
          its own line, on a wider screen there is room and it stays in the row, at
          the right, where it was. One node either way — `w-full sm:w-auto` on the
          control itself does the switching. */}
      {pick && <div className="w-full sm:w-auto">{pick}</div>}
    </button>
  );
}
