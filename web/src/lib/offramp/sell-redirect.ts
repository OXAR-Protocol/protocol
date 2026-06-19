/**
 * Off-ramp via the Transak SELL widget (the user's own Transak account/apiKey).
 *
 * Transak renders the whole sell flow (KYC, card/SEPA payout, the receive address)
 * — non-custodial, no PCI/MSB on us. We just open it pre-filled. The apiKey is a
 * publishable frontend key (safe under NEXT_PUBLIC_). Staging needs no KYB and is
 * great for testing; production payouts need Transak's KYB (a Transak requirement,
 * unrelated to Privy). SELL must be enabled in the Transak partner portal, and the
 * app's domain added to the portal's allowed domains.
 *
 * Env:
 *   NEXT_PUBLIC_TRANSAK_API_KEY   — your Transak apiKey (staging or production)
 *   NEXT_PUBLIC_TRANSAK_ENV       — "STAGING" (default) | "PRODUCTION"
 */
const API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY;
const ENV = (process.env.NEXT_PUBLIC_TRANSAK_ENV ?? "STAGING").toUpperCase();
const BASE = ENV === "PRODUCTION" ? "https://global.transak.com" : "https://global-stg.transak.com";

/** Whether a Transak apiKey is configured (gates the cash-out button). */
export function offrampConfigured(): boolean {
  return !!API_KEY;
}

/** Transak SELL URL pre-filled for USDC on Solana → card (EUR). Null if no apiKey. */
export function transakSellUrl(opts: { walletAddress?: string } = {}): string | null {
  if (!API_KEY) return null;
  const params = new URLSearchParams({
    apiKey: API_KEY,
    productsAvailed: "SELL",
    cryptoCurrencyCode: "USDC",
    network: "solana",
    fiatCurrency: "EUR",
    paymentMethod: "credit_debit_card",
  });
  if (opts.walletAddress) params.set("walletAddress", opts.walletAddress);
  return `${BASE}/?${params.toString()}`;
}
