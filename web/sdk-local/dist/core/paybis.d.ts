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
export declare const PAYBIS_SELL_ASSET = "USDC-BASE";
/** Buying lands straight on Solana, which is where the wallet already is. */
export declare const PAYBIS_BUY_ASSET = "USDC-SOL";
export declare const PAYBIS_FIATS: readonly ["UAH", "EUR", "USD"];
export type PaybisFiat = (typeof PAYBIS_FIATS)[number];
export type PaybisSide = "buy" | "sell";
/** Above this share of the order, say plainly that the fee is large for the amount. */
export declare const PAYBIS_FEE_WARN_FRACTION = 0.05;
export interface PaybisQuoteRequest {
    currencyCodeFrom: string;
    currencyCodeTo: string;
    requestedAmount: {
        amount: string;
        currencyCode: string;
    };
    requestedAmountType: "from";
}
/** `amount` is always what the user parts with: USDC when selling, fiat when buying. */
export declare function buildPaybisQuote(side: PaybisSide, amount: string, fiat: PaybisFiat): PaybisQuoteRequest;
export interface PaybisQuote {
    /** What lands: fiat on the card when selling, USDC in the wallet when buying. */
    receive: number;
    receiveCurrency: string;
    fee: number;
    feeCurrency: string;
    /** Share of the order the fee eats — the number worth putting in front of someone. */
    feeFraction: number;
}
/**
 * Why the card leg can't be quoted, in their words — most often that the order is
 * under their minimum. This arrives with HTTP 200 next to a payout of 0.00, so
 * reading only the amount would show the user a confident zero instead of the reason.
 */
export declare function readPaybisError(side: PaybisSide, json: unknown): string | null;
/** Read the card leg out of a Paybis quote. Null when they quote no card route. */
export declare function readPaybisQuote(side: PaybisSide, json: unknown): PaybisQuote | null;
/**
 * Where we send the user. Paybis has no deep link for the sell flow — asset and
 * network come from the path — but the buy page does take currency and amount, so a
 * purchase opens already filled in.
 */
export declare function paybisSellUrl(): string;
export declare function paybisBuyUrl(fiat: PaybisFiat, amount?: number): string;
