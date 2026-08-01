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
export declare const PAYBIS_SELL_ASSET = "USDC-BASE";
export declare const PAYBIS_FIATS: readonly ["UAH", "EUR"];
export type PaybisFiat = (typeof PAYBIS_FIATS)[number];
/** Above this share of the sale, say plainly that the fee is large for this amount. */
export declare const PAYBIS_FEE_WARN_FRACTION = 0.05;
export interface PaybisQuoteRequest {
    currencyCodeFrom: string;
    currencyCodeTo: PaybisFiat;
    requestedAmount: {
        amount: string;
        currencyCode: string;
    };
    requestedAmountType: "from";
}
export declare function buildPaybisSellQuote(amount: string, fiat: PaybisFiat): PaybisQuoteRequest;
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
/**
 * Why the card leg can't be quoted, in their words — most often "at least 5.001 USDC
 * per order". This arrives with HTTP 200 alongside a payout of 0.00, so reading only
 * the amount would show the user a confident zero instead of the reason.
 */
export declare function readPaybisCardError(json: unknown): string | null;
/** Read the card-payout leg out of a Paybis quote. Null when they quote no card route. */
export declare function readPaybisCardQuote(json: unknown): PaybisQuote | null;
/**
 * Where we send the user to start the sale. Paybis has no deep-link parameters for
 * the sell flow — asset and network come from the path, everything else is picked by
 * hand on their side, which is why the sheet walks through it.
 */
export declare function paybisSellUrl(): string;
