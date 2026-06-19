/**
 * Mercuryo hosted "sell" (off-ramp) entry — the no-account redirect path.
 *
 * The user lands on Mercuryo's own page, verifies once (light-KYC up to €699),
 * picks a card, and is shown a deposit address to send their USDC to. Mercuryo is
 * the licensed, non-custodial payout agent (Visa Direct / Mastercard Send → card
 * in minutes). We pass best-effort hints only — NO address/signature, since those
 * require a partner secret (the embedded "magic" flow; see the cash-out spec).
 *
 * Override the base via NEXT_PUBLIC_MERCURYO_SELL_URL once the exact working URL /
 * params are confirmed on a live test.
 */
const SELL_BASE = process.env.NEXT_PUBLIC_MERCURYO_SELL_URL ?? "https://exchange.mercuryo.io/";

export function mercuryoSellUrl(opts: { currency?: string; network?: string } = {}): string {
  const params = new URLSearchParams({ type: "sell" });
  if (opts.currency) params.set("currency", opts.currency);
  if (opts.network) params.set("network", opts.network);
  return `${SELL_BASE}?${params.toString()}`;
}
