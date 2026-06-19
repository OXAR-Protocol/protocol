/**
 * No-account off-ramp redirect (sell crypto → fiat to card).
 *
 * Mercuryo's `exchange.mercuryo.io` is a partner-only widget endpoint — opened
 * directly without a `widget_id` it returns 403 "Service unavailable for your
 * region" (it has no public consumer sell page; it's B2B-only). So we point at
 * Guardarian's **account-free** consumer flow instead — EU-licensed, non-custodial,
 * sells USDC to a card, and covers Ukraine + the EU with no integrator account.
 *
 * Override via NEXT_PUBLIC_OFFRAMP_SELL_URL once the exact sell deep-link / params
 * are confirmed on a live test (grab the URL Guardarian shows after picking "Sell").
 */
const SELL_URL = process.env.NEXT_PUBLIC_OFFRAMP_SELL_URL ?? "https://guardarian.com/";

export function offrampSellUrl(): string {
  return SELL_URL;
}
