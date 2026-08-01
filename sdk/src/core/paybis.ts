/**
 * Paybis on/off-ramp: quote request building and response reading.
 *
 * Paybis is the counterparty to the user — their licence, their KYC, their money
 * movement. We never touch the fiat, so no entity or licence is needed on our side;
 * we hand over a link and (on the way out) an address to pay.
 *
 * We quote first because the fee is invisible until you see the number, and it bites
 * hardest exactly where a new user starts — small. Selling 20 USDC loses ~20%, 100
 * loses ~4.4%, 1000 loses ~0.8%; buying has a ~2 EUR floor, so 5 EUR loses 40% and
 * 100 loses 4.5%. Showing the payout before anyone commits turns a nasty surprise
 * into a choice. The calls go through `/api/paybis-quote`; this file is pure.
 */

/** Selling goes over Base — their Solana USDC is buy-only. */
export const PAYBIS_SELL_ASSET = "USDC-BASE";
/** Buying lands straight on Solana, which is where the wallet already is. */
export const PAYBIS_BUY_ASSET = "USDC-SOL";

export const PAYBIS_FIATS = ["UAH", "EUR", "USD"] as const;
export type PaybisFiat = (typeof PAYBIS_FIATS)[number];

export type PaybisSide = "buy" | "sell";

/** Above this share of the order, say plainly that the fee is large for the amount. */
export const PAYBIS_FEE_WARN_FRACTION = 0.05;

/**
 * The two legs answer with the same envelope under different names, and each carries
 * its own card-method id. Everything else about reading them is identical.
 */
const LEG = {
  sell: {
    asset: PAYBIS_SELL_ASSET,
    methods: "payoutMethods",
    errors: "payoutMethodErrors",
    errorField: "payoutMethod",
    cardId: "credit-card-out",
  },
  buy: {
    asset: PAYBIS_BUY_ASSET,
    methods: "paymentMethods",
    errors: "paymentMethodErrors",
    errorField: "paymentMethod",
    cardId: "credit-card",
  },
} as const;

export interface PaybisQuoteRequest {
  currencyCodeFrom: string;
  currencyCodeTo: string;
  requestedAmount: { amount: string; currencyCode: string };
  requestedAmountType: "from";
}

/** `amount` is always what the user parts with: USDC when selling, fiat when buying. */
export function buildPaybisQuote(side: PaybisSide, amount: string, fiat: PaybisFiat): PaybisQuoteRequest {
  const from = side === "sell" ? LEG.sell.asset : fiat;
  const to = side === "sell" ? fiat : LEG.buy.asset;
  return {
    currencyCodeFrom: from,
    currencyCodeTo: to,
    requestedAmount: { amount, currencyCode: from },
    requestedAmountType: "from",
  };
}

export interface PaybisQuote {
  /** What lands: fiat on the card when selling, USDC in the wallet when buying. */
  receive: number;
  receiveCurrency: string;
  fee: number;
  feeCurrency: string;
  /** Share of the order the fee eats — the number worth putting in front of someone. */
  feeFraction: number;
}

interface RawAmount {
  amount?: unknown;
  currencyCode?: unknown;
}
interface RawMethod {
  id?: unknown;
  amountFrom?: RawAmount;
  amountTo?: RawAmount;
  amountFromEquivalent?: RawAmount;
  fees?: { totalFee?: RawAmount };
}
interface RawMethodError {
  error?: { message?: unknown };
  [key: string]: unknown;
}

const num = (v: unknown): number => {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : NaN;
};
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Why the card leg can't be quoted, in their words — most often that the order is
 * under their minimum. This arrives with HTTP 200 next to a payout of 0.00, so
 * reading only the amount would show the user a confident zero instead of the reason.
 */
export function readPaybisError(side: PaybisSide, json: unknown): string | null {
  const leg = LEG[side];
  const errors = (json as Record<string, unknown>)?.[leg.errors];
  if (!Array.isArray(errors)) return null;
  const hit = (errors as RawMethodError[]).find((e) => e[leg.errorField] === leg.cardId);
  return typeof hit?.error?.message === "string" ? hit.error.message : null;
}

/** Read the card leg out of a Paybis quote. Null when they quote no card route. */
export function readPaybisQuote(side: PaybisSide, json: unknown): PaybisQuote | null {
  if (readPaybisError(side, json)) return null;

  const leg = LEG[side];
  const methods = (json as Record<string, unknown>)?.[leg.methods];
  if (!Array.isArray(methods)) return null;

  const card = (methods as RawMethod[]).find((m) => m.id === leg.cardId);
  if (!card) return null;

  const receive = num(card.amountTo?.amount);
  const fee = num(card.fees?.totalFee?.amount);
  if (!Number.isFinite(receive)) return null;

  // Selling: the fee is quoted in the fiat we receive, so compare it against what the
  // crypto is worth at their rate. Buying: it is quoted in the fiat we spend.
  const basis = side === "sell" ? num(card.amountFromEquivalent?.amount) : num(card.amountFrom?.amount);
  if (!Number.isFinite(basis) || basis <= 0) return null;

  const feeCurrency = side === "sell" ? str(card.amountTo?.currencyCode) : str(card.amountFrom?.currencyCode);
  const resolvedFee = Number.isFinite(fee) ? fee : Math.max(basis - receive, 0);

  return {
    receive,
    receiveCurrency: str(card.amountTo?.currencyCode),
    fee: resolvedFee,
    feeCurrency,
    feeFraction: resolvedFee / basis,
  };
}

/**
 * Where we send the user. Paybis has no deep link for the sell flow — asset and
 * network come from the path — but the buy page does take currency and amount, so a
 * purchase opens already filled in.
 */
export function paybisSellUrl(): string {
  return "https://paybis.com/sell-usdc-base/";
}

export function paybisBuyUrl(fiat: PaybisFiat, amount?: number): string {
  const qs = new URLSearchParams({ currency: fiat });
  if (amount && amount > 0) qs.set("amount", String(amount));
  return `https://paybis.com/buy-usd-coin-solana/?${qs.toString()}`;
}
