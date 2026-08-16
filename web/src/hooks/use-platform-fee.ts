"use client";

import { PLATFORM_FEE_BPS } from "@oxar/sdk";

import { useFeature } from "@/hooks/use-features";
import { FEE_ACCOUNT_USDC } from "@/lib/constants";

/**
 * Our rate, in basis points — `0` whenever we're not charging.
 *
 * Two switches have to agree before a single cent is ours: the feature flag, and an
 * account to collect into. Either one alone does nothing, so neither a flag flipped
 * by mistake nor a stray env var can quietly start billing people.
 *
 * Everything that quotes a price reads the rate from here, so the figure on the
 * confirm screen and the figure in the transaction can't disagree — the whole point
 * of the "no surprises" review is that it's the same arithmetic.
 */
export function usePlatformFeeBps(): number {
  return useFeature("platform-fee") && FEE_ACCOUNT_USDC ? PLATFORM_FEE_BPS : 0;
}
