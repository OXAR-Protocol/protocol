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
export function MarketRow({ seed, onOpen, disabled, lead, chart, figure, pick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      className="group relative isolate flex w-full items-center gap-3 overflow-hidden rounded-[8px] border border-black/10 bg-white p-5 text-left transition-colors hover:border-black/30 disabled:opacity-50"
    >
      <BanknoteBg seed={seed} />

      <div className="min-w-0 flex-1">{lead}</div>

      <div className="hidden w-[140px] shrink-0 sm:block">{chart}</div>

      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
        {/* Fixed width from `sm` up so the figures line up down the list; on a
            phone the cluster is as wide as the pick pill, which does the same. */}
        <div className="text-right sm:w-[112px]">{figure}</div>
        {pick}
      </div>
    </button>
  );
}
