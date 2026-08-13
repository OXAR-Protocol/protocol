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
      className={`group relative isolate flex w-full flex-col gap-3 overflow-hidden rounded-[8px] border bg-white p-5 text-left transition-colors disabled:opacity-50 ${
        selected ? "border-black/40 ring-1 ring-black/10" : "border-black/10 hover:border-black/30"
      }`}
    >
      <BanknoteBg seed={seed} />

      <div className="flex w-full items-center gap-3">
        <div className="min-w-0 flex-1">{lead}</div>

        <div className="hidden w-[140px] shrink-0 sm:block">{chart}</div>

        {/* A floor, not a cap, from `sm` up: it lines the figures up down the list,
            while a longer label underneath ("… since you bought") takes the width it
            needs instead of wrapping into a ragged stack. */}
        <div className="shrink-0 text-right sm:min-w-[112px]">{figure}</div>
      </div>

      {/* Under the row, its full width — the same shape the cards use. Beside the
          figure it was a ~125px pill eating a third of a phone's width and pushing
          the name into a wrap; below, the row keeps its line and gains a little
          height instead. */}
      {pick}
      {trailing}
    </button>
  );
}
