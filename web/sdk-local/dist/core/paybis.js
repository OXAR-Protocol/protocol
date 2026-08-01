"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYBIS_FEE_WARN_FRACTION = exports.PAYBIS_FIATS = exports.PAYBIS_SELL_ASSET = void 0;
exports.buildPaybisSellQuote = buildPaybisSellQuote;
exports.readPaybisCardError = readPaybisCardError;
exports.readPaybisCardQuote = readPaybisCardQuote;
exports.paybisSellUrl = paybisSellUrl;
/** The asset Paybis buys from us. Their Solana USDC is buy-only — selling needs Base. */
exports.PAYBIS_SELL_ASSET = "USDC-BASE";
exports.PAYBIS_FIATS = ["UAH", "EUR"];
/** Card payout. The other methods they return are Skrill / Neteller / SEPA. */
const CARD_PAYOUT_METHOD = "credit-card-out";
/** Above this share of the sale, say plainly that the fee is large for this amount. */
exports.PAYBIS_FEE_WARN_FRACTION = 0.05;
function buildPaybisSellQuote(amount, fiat) {
    return {
        currencyCodeFrom: exports.PAYBIS_SELL_ASSET,
        currencyCodeTo: fiat,
        requestedAmount: { amount, currencyCode: exports.PAYBIS_SELL_ASSET },
        requestedAmountType: "from",
    };
}
const num = (v) => {
    const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : NaN;
};
/**
 * Why the card leg can't be quoted, in their words — most often "at least 5.001 USDC
 * per order". This arrives with HTTP 200 alongside a payout of 0.00, so reading only
 * the amount would show the user a confident zero instead of the reason.
 */
function readPaybisCardError(json) {
    const errors = json?.payoutMethodErrors;
    if (!Array.isArray(errors))
        return null;
    const hit = errors.find((e) => e.payoutMethod === CARD_PAYOUT_METHOD);
    return typeof hit?.error?.message === "string" ? hit.error.message : null;
}
/** Read the card-payout leg out of a Paybis quote. Null when they quote no card route. */
function readPaybisCardQuote(json) {
    if (readPaybisCardError(json))
        return null;
    const methods = json?.payoutMethods;
    if (!Array.isArray(methods))
        return null;
    const list = methods;
    const card = list.find((m) => m.id === CARD_PAYOUT_METHOD);
    if (!card)
        return null;
    const receive = num(card.amountTo?.amount);
    const marketValue = num(card.amountFromEquivalent?.amount);
    const fee = num(card.fees?.totalFee?.amount);
    const currency = typeof card.amountTo?.currencyCode === "string" ? card.amountTo.currencyCode : "";
    if (!Number.isFinite(receive) || !Number.isFinite(marketValue) || marketValue <= 0)
        return null;
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
function paybisSellUrl() {
    return "https://paybis.com/sell-usdc-base/";
}
