/**
 * What we take on a swap, and where it lands.
 *
 * The one place in the app that can charge anything. Buying, selling and turning
 * coins into dollars all pass through a Jupiter swap, and Jupiter lets an integrator
 * name a fee in basis points plus an account to receive it — no referral program
 * needed since January 2025, any valid token account will do.
 *
 * Two decisions are encoded here:
 *
 * ALWAYS IN DOLLARS. On an exact-in swap the fee may be taken from either side of
 * the pair. Buying, the input is USDC; selling, the output is. Taking it in USDC
 * both ways means one account, one currency, and no dust in a tokenized share that
 * would then have to be sold to be worth anything.
 *
 * MODEST ON PURPOSE. A wallet charges ~0.85% for the same swap (MetaMask 0.875%,
 * Phantom 0.85%, both folded into the quote without a line item). A third of that,
 * stated out loud before signing, is a different proposition — and the audience we
 * serve isn't chasing basis points, it is deciding whether to trust us.
 */

/** Basis points we take when the fee is on. 25 = 0.25%. */
export const PLATFORM_FEE_BPS = 25;

/** Fee in dollars for a swap of `usdAmount`, at the current rate. */
export function platformFeeUsd(usdAmount: number, bps = PLATFORM_FEE_BPS): number {
  return usdAmount > 0 ? (usdAmount * bps) / 10_000 : 0;
}
