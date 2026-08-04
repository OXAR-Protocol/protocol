"use client";

import { Check } from "lucide-react";

import { compactUsd } from "@oxar/sdk";

import { useProviderTvl } from "@/hooks/use-provider-tvl";
import { isPriceExposure } from "@/lib/yield/assets";
import { getPlatform } from "@/lib/yield/platform";
import { useT } from "@/lib/i18n";
import type { ProviderView } from "@/hooks/use-yield-positions";

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
  const { t } = useT();
  const tvl = useProviderTvl(view.defiLlamaPoolId);
  const price = isPriceExposure(view.id);
  const platform = getPlatform(view.id);

  // Price assets used to claim "sell anytime" unconditionally — a promise about
  // getting a good result, not just permission. On a thin ticker the honest
  // answer is "you can always try, the market sets what you get" (see the
  // exit-cost line on the buy panel), so the chip states that instead.
  const chips = price
    ? [t("trust.marketPriced"), t("trust.noLock"), t("trust.selfCustody")]
    : view.heldMint
      ? [t("trust.withdrawAnytime"), t("trust.noLock"), t("trust.selfCustody")]
      : [t("trust.withdrawAnytime"), t("trust.noLock"), t("trust.noFees")];

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
      {(platform || tvl !== null) && (
        <p className="text-[14px] text-black/55">
          {platform && (
            <>
              {platform.kind === "lent" ? `${t("trust.lentOn")} ` : `${t("trust.issuedBy")} `}
              <span className="font-medium text-black">{platform.name}</span>
            </>
          )}
          {platform && tvl !== null && " · "}
          {tvl !== null && (
            <>
              <span className="font-medium text-black tabular-nums">{compactUsd(tvl)}</span>{" "}
              {price ? t("trust.held") : t("trust.deposited")}
            </>
          )}
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
