"use client";

import { AddressLine, Chart, EarlyRiser, Facts, Figures, Gear, Ranges, Total } from "./parts";
import { YOU } from "./data";

/**
 * Four takes on the same screen. They differ in ONE decision each, so the choice
 * between them is a choice about that decision and not about forty small things at
 * once:
 *
 *  A — today, faithfully. The baseline to judge the rest against.
 *  B — the money is the headline; identity shrinks to a line.
 *  C — identity gets a surface of its own; the money sits on the page.
 *  D — every block on its own card. The maximal reading of "put it in outlines".
 */

/** A: what ships today. 64px hashed colour plate, address as the h1. */
export function VariantA() {
  return (
    <>
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#b45309] text-[24px] uppercase text-paper">
          a
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-[clamp(22px,3vw,32px)] leading-tight tracking-[-0.03em] text-ink">
              {YOU.short}
            </h1>
          </div>
          <div className="mt-1">
            <EarlyRiser />
          </div>
        </div>
        <Gear />
      </div>

      <div className="mb-6 mt-5">
        <Facts />
      </div>

      <p className="text-[11px] lowercase tracking-wide text-ink/40">everything, all together</p>
      <div className="mt-1">
        <Total size="clamp(30px,6vw,44px)" />
      </div>
      <Ranges />
      <Chart />
      <Figures />
    </>
  );
}

/** B: the money is the headline. No plate at all; the address becomes a footnote,
 *  which is what an identifier you copy actually is. */
export function VariantB() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] lowercase tracking-wide text-ink/40">everything, all together</p>
          <div className="mt-1.5">
            <Total />
          </div>
        </div>
        <Gear />
      </div>

      <Ranges />
      <Chart />

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Facts icons={false} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <AddressLine size="12px" />
        <EarlyRiser />
      </div>

      <Figures flat />
    </>
  );
}

/** C: one surface break. Identity on a card, money on the page — so the page has a
 *  top and a body instead of one flat plane. The plate stays, but neutral and small:
 *  the colour was picked by hashing the address, which made the loudest thing on a
 *  money screen a coin flip. */
export function VariantC() {
  return (
    <>
      <section className="rounded-panel border border-ink/10 bg-paper p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] text-[15px] uppercase text-ink/70">
            a
          </span>
          <div className="min-w-0">
            <AddressLine size="14px" />
          </div>
          <span className="ml-auto">
            <EarlyRiser />
          </span>
        </div>
        <div className="mt-3.5 border-t border-ink/[0.07] pt-3.5">
          <Facts icons={false} />
        </div>
      </section>

      <div className="mt-8">
        <p className="text-[11px] lowercase tracking-wide text-ink/40">everything, all together</p>
        <div className="mt-1.5">
          <Total />
        </div>
        <Ranges />
        <Chart />
        <Figures />
      </div>
    </>
  );
}

/** D: everything carded. Included so the maximal reading of "outlines and modals"
 *  can be looked at rather than imagined — four surfaces stacked, each with its own
 *  border, and the page stops having a focal point. */
export function VariantD() {
  return (
    <div className="space-y-3">
      <section className="rounded-panel border border-ink/10 bg-paper p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] text-[15px] uppercase text-ink/70">
            a
          </span>
          <AddressLine size="14px" />
          <span className="ml-auto">
            <EarlyRiser />
          </span>
        </div>
      </section>

      <section className="rounded-panel border border-ink/10 bg-paper p-4">
        <p className="text-[11px] lowercase tracking-wide text-ink/40">everything, all together</p>
        <div className="mt-1.5">
          <Total size="clamp(30px,7vw,44px)" />
        </div>
        <Ranges />
        <Chart bleed={false} />
      </section>

      <section className="rounded-panel border border-ink/10 bg-paper p-4">
        <Facts />
      </section>

      <section className="rounded-panel border border-ink/10 bg-paper px-4 pb-1 pt-2">
        <Figures flat />
      </section>
    </div>
  );
}
