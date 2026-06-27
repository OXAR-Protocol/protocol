"use client";

import { Check } from "lucide-react";

import { useProviderTvl } from "@/hooks/use-provider-tvl";
import { isPriceExposure } from "@/lib/yield/assets";
import type { ProviderView } from "@/hooks/use-yield-positions";

/** Compact USD: $143M, $1.4B, $920K. */
function compactUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

/**
 * Trust strip under the asset headline: TVL social-proof ("you're not first —
 * $143M already sleeps here") + the non-custodial guarantees that set us apart
 * from vault apps with cooldowns and performance fees. Trust is the product's
 * only real asset, so we surface it plainly rather than burying it in fine print.
 *
 * Honesty matters more than the pitch: swap-and-hold sources (Ondo, stocks, gold)
 * carry a one-time swap cost, so they never claim "no fees" — only pure lend does.
 */
export function AssetTrustStrip({ view }: { view: ProviderView }) {
  const tvl = useProviderTvl(view.defiLlamaPoolId);
  const price = isPriceExposure(view.id);

  const chips = price
    ? ["sell anytime", "no lock-up", "self-custody"]
    : view.heldMint
      ? ["withdraw anytime", "no lock-up", "self-custody"]
      : ["withdraw anytime", "no lock-up", "no fees"];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
      {tvl !== null && (
        <p className="text-[14px] text-black/55">
          <span className="font-medium text-black tabular-nums">{compactUsd(tvl)}</span>{" "}
          {price ? "held here" : "deposited here"}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-[12px] lowercase tracking-wide text-black/55"
          >
            <Check size={12} strokeWidth={2} className="text-[#3c05c7]" />
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
