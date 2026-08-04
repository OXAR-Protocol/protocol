"use client";

import { compactUsd } from "@oxar/sdk";

import { useProviderTvl } from "@/hooks/use-provider-tvl";
import { getPlatform } from "@/lib/yield/platform";
import { useT } from "@/lib/i18n";

/**
 * The trust fact, in the list — where the choosing happens.
 *
 * It already existed on the asset page, which is one tap too late: by then a
 * person has picked. Someone scanning the list can't tell whether a name has
 * $143M behind it or nothing at all.
 *
 * Deliberately NOT a recommendation. Every row gets the same field in the same
 * shape; there is no badge, no "popular", and the list's default order ignores
 * it. Stating a fact about every option is information; decorating one of them
 * is a view, and a view is advice we're not licensed to give.
 *
 * `poolId` is absent for swap-held assets (stocks, gold), whose "TVL" is the
 * size of a tokenised wrapper — a number that means something entirely
 * different and would read as "nobody wants this" beside a lending pool. Those
 * get the issuer instead, which is the trust signal that actually applies.
 *
 * No "running since": DefiLlama's chart endpoint returns a fixed ~159-day
 * window, identical for every pool we list, so age can't be derived from it.
 * A number that says the same thing about everything says nothing.
 */
export function TrustLine({ poolId, sourceId }: { poolId?: string; sourceId: string }) {
  const { t } = useT();
  const tvl = useProviderTvl(poolId);
  const platform = getPlatform(sourceId);

  const fact =
    tvl !== null
      ? `${compactUsd(tvl)} ${t("trust.deposited")}`
      : platform
        ? platform.name
        : null;

  if (!fact) return null;
  return <p className="mt-1 text-[11px] tabular-nums text-black/40">{fact}</p>;
}
