"use client";

import { useCallback } from "react";

import { formatUsdAmount } from "@oxar/sdk";

import { MoneyActions } from "@/components/money-actions";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useLiveBalances } from "@/hooks/use-live-balances";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useT } from "@/lib/i18n";

/**
 * The second question, right under the first.
 *
 * "How much do I have" and "how much can I spend right now" are asked one after the
 * other, and every bank answers them that way. Both figures were already computed
 * here — they just lived in a card below the chart, which is below the analytics,
 * which is below the fold. So the answer to the more urgent of the two questions was
 * the further away.
 *
 * The acts sit on the same line, because a figure invites an act and the only thing
 * you could previously press near the balance was a floating button overlapping the
 * tab bar.
 */
export function MoneySplit() {
  const { t } = useT();
  const { totalUsdc } = useAggregatePersonalBalance();
  // "Free to use" is the dollars, read off the chain — the same figure the money
  // sheet and the buying screen show.
  const cash = useUsdcBalance();
  const refreshCash = cash.refresh;
  useLiveBalances(useCallback(() => refreshCash(), [refreshCash]));

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
      <p className="text-[13px] tabular-nums text-ink/50">
        {t("profile.working", { value: `$${formatUsdAmount(totalUsdc)}` })}
        <span className="text-ink/25"> · </span>
        {t("profile.freeToUse", {
          value: cash.usd === null ? "—" : `$${formatUsdAmount(cash.usd)}`,
        })}
      </p>
      <MoneyActions labelled />
    </div>
  );
}
