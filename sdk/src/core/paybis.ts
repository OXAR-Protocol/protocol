/**
 * Paybis cash-out: quote request building and response reading.
 *
 * Paybis is the counterparty to the user — their licence, their KYC, their payout.
 * We never touch the fiat, so no entity or licence is needed on our side; we hand
 * over a link and an address to pay.
 *
 * We quote first because their pricing is a FLAT fee plus a small percentage, which
 * is invisible until you see the number: selling 20 USDC loses ~20%, 100 loses ~4.4%,
 * 1000 loses ~0.8%. Showing the payout before anyone commits turns a nasty surprise
 * into a choice. The call itself goes through `/api/paybis-quote`; this file is pure.
 */

/** The asset Paybis buys from us. Their Solana USDC is buy-only — selling needs Base. */
export const PAYBIS_SELL_ASSET = "USDC-BASE";

export const PAYBIS_FIATS = ["UAH", "EUR"] as const;
export type PaybisFiat = (typeof PAYBIS_FIATS)[number];

/** Card payout. The other methods they return are Skrill / Neteller / SEPA. */
const CARD_PAYOUT_METHOD = "credit-card-out";

/** Above this share of the sale, say plainly that the fee is large for this amount. */
export const PAYBIS_FEE_WARN_FRACTION = 0.05;

export interface PaybisQuoteRequest {
  currencyCodeFrom: string;
  currencyCodeTo: PaybisFiat;
  requestedAmount: { amount: string; currencyCode: string };
  requestedAmountType: "from";
}

export function buildPaybisSellQuote(amount: string, fiat: PaybisFiat): PaybisQuoteRequest {
  return {
    currencyCodeFrom: PAYBIS_SELL_ASSET,
    currencyCodeTo: fiat,
    requestedAmount: { amount, currencyCode: PAYBIS_SELL_ASSET },
    requestedAmountType: "from",
  };
}

export interface PaybisQuote {
  /** Fiat the user actually receives on the card. */
  receive: number;
  currency: string;
  /** What the crypto is worth at their rate, before the fee. */
  marketValue: number;
  fee: number;
  /** Fee as a share of market value — the number worth showing. */
  feeFraction: number;
}

interface RawAmount {
  amount?: unknown;
  currencyCode?: unknown;
}
interface RawPayoutMethod {
  id?: unknown;
  amountTo?: RawAmount;
  amountFromEquivalent?: RawAmount;
  fees?: { totalFee?: RawAmount };
}

const num = (v: unknown): number => {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : NaN;
};

interface RawMethodError {
  payoutMethod?: unknown;
  error?: { message?: unknown };
}

/**
 * Why the card leg can't be quoted, in their words — most often "at least 5.001 USDC
 * per order". This arrives with HTTP 200 alongside a payout of 0.00, so reading only
 * the amount would show the user a confident zero instead of the reason.
 */
export function readPaybisCardError(json: unknown): string | null {
  const errors = (json as { payoutMethodErrors?: unknown })?.payoutMethodErrors;
  if (!Array.isArray(errors)) return null;
  const hit = (errors as RawMethodError[]).find((e) => e.payoutMethod === CARD_PAYOUT_METHOD);
  return typeof hit?.error?.message === "string" ? hit.error.message : null;
}

/** Read the card-payout leg out of a Paybis quote. Null when they quote no card route. */
export function readPaybisCardQuote(json: unknown): PaybisQuote | null {
  if (readPaybisCardError(json)) return null;

  const methods = (json as { payoutMethods?: unknown })?.payoutMethods;
  if (!Array.isArray(methods)) return null;

  const list = methods as RawPayoutMethod[];
  const card = list.find((m) => m.id === CARD_PAYOUT_METHOD);
  if (!card) return null;

  const receive = num(card.amountTo?.amount);
  const marketValue = num(card.amountFromEquivalent?.amount);
  const fee = num(card.fees?.totalFee?.amount);
  const currency = typeof card.amountTo?.currencyCode === "string" ? card.amountTo.currencyCode : "";
  if (!Number.isFinite(receive) || !Number.isFinite(marketValue) || marketValue <= 0) return null;

  return {
    receive,
    currency,
    marketValue,
    fee: Number.isFinite(fee) ? fee : marketValue - receive,
    feeFraction: (marketValue - receive) / marketValue,
  };
}

/**
 * Where we send the user to start the sale. Paybis has no deep-link parameters for
 * the sell flow — asset and network come from the path, everything else is picked by
 * hand on their side, which is why the sheet walks through it.
 */
export function paybisSellUrl(): string {
  return "https://paybis.com/sell-usdc-base/";
}
