"use client";

import { useState } from "react";

import { dmSans } from "@/components/landing-v2/fonts";
import { VariantA, VariantB, VariantC, VariantD } from "./variants";

/**
 * A picker over four takes on `/you`. NOT part of the product.
 *
 * This route exists so the choice can be made by looking rather than by reading a
 * description of a layout. It lives outside `APP_ROUTES`, so it stays on the
 * marketing host and needs no wallet, no login and no gate — the preview URL opens
 * on a phone and works. Strings are hardcoded on purpose: nothing here goes through
 * `t()`, because nothing here is meant to ship.
 *
 * Delete this folder once a variant is chosen and built for real.
 */

const VARIANTS = [
  { key: "A", name: "today", note: "the baseline — 64px colour plate, address as the headline", Body: VariantA },
  { key: "B", name: "money first", note: "no plate; the balance is the headline, the address a footnote", Body: VariantB },
  { key: "C", name: "identity card", note: "one surface break — who you are on a card, money on the page", Body: VariantC },
  { key: "D", name: "all carded", note: "every block in its own outline, so the maximal version is visible", Body: VariantD },
] as const;

export default function ProtoYou() {
  const [i, setI] = useState(0);
  const V = VARIANTS[i]!;

  return (
    <div data-theme="dark" className={`${dmSans.variable} ${dmSans.className} min-h-screen bg-page text-ink`}>
      {/* The switcher is chrome, not part of the design being judged — it stays out
          of the way at the top and says which take you are looking at. */}
      <div className="safe-top sticky top-0 z-50 border-b border-ink/10 bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {VARIANTS.map((v, n) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setI(n)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[12px] lowercase tracking-wide transition active:scale-[0.97] ${
                n === i ? "bg-ink text-paper" : "border border-ink/15 text-ink/55"
              }`}
            >
              {v.key} · {v.name}
            </button>
          ))}
        </div>
        <p className="mx-auto max-w-[1100px] px-4 pb-2.5 text-[11px] leading-snug text-ink/40">{V.note}</p>
      </div>

      <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-6">
        <V.Body />
      </div>
    </div>
  );
}
