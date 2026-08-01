"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYBIS_FEE_WARN_FRACTION = exports.PAYBIS_FIATS = exports.PAYBIS_BUY_ASSET = exports.PAYBIS_SELL_ASSET = void 0;
exports.buildPaybisQuote = buildPaybisQuote;
exports.readPaybisError = readPaybisError;
exports.readPaybisQuote = readPaybisQuote;
exports.paybisSellUrl = paybisSellUrl;
exports.paybisBuyUrl = paybisBuyUrl;
/** Selling goes over Base — their Solana USDC is buy-only. */
exports.PAYBIS_SELL_ASSET = "USDC-BASE";
/** Buying lands straight on Solana, which is where the wallet already is. */
exports.PAYBIS_BUY_ASSET = "USDC-SOL";
exports.PAYBIS_FIATS = ["UAH", "EUR", "USD"];
/** Above this share of the order, say plainly that the fee is large for the amount. */
exports.PAYBIS_FEE_WARN_FRACTION = 0.05;
/**
 * The two legs answer with the same envelope under different names, and each carries
 * its own card-method id. Everything else about reading them is identical.
 */
const LEG = {
    sell: {
        asset: exports.PAYBIS_SELL_ASSET,
        methods: "payoutMethods",
        errors: "payoutMethodErrors",
        errorField: "payoutMethod",
        cardId: "credit-card-out",
    },
    buy: {
        asset: exports.PAYBIS_BUY_ASSET,
        methods: "paymentMethods",
        errors: "paymentMethodErrors",
        errorField: "paymentMethod",
        cardId: "credit-card",
    },
};
/** `amount` is always what the user parts with: USDC when selling, fiat when buying. */
function buildPaybisQuote(side, amount, fiat) {
    const from = side === "sell" ? LEG.sell.asset : fiat;
    const to = side === "sell" ? fiat : LEG.buy.asset;
    return {
        currencyCodeFrom: from,
        currencyCodeTo: to,
        requestedAmount: { amount, currencyCode: from },
        requestedAmountType: "from",
    };
}
const num = (v) => {
    const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : NaN;
};
const str = (v) => (typeof v === "string" ? v : "");
/**
 * Why the card leg can't be quoted, in their words — most often that the order is
 * under their minimum. This arrives with HTTP 200 next to a payout of 0.00, so
 * reading only the amount would show the user a confident zero instead of the reason.
 */
function readPaybisError(side, json) {
    const leg = LEG[side];
    const errors = json?.[leg.errors];
    if (!Array.isArray(errors))
        return null;
    const hit = errors.find((e) => e[leg.errorField] === leg.cardId);
    return typeof hit?.error?.message === "string" ? hit.error.message : null;
}
/** Read the card leg out of a Paybis quote. Null when they quote no card route. */
function readPaybisQuote(side, json) {
    if (readPaybisError(side, json))
        return null;
    const leg = LEG[side];
    const methods = json?.[leg.methods];
    if (!Array.isArray(methods))
        return null;
    const card = methods.find((m) => m.id === leg.cardId);
    if (!card)
        return null;
    const receive = num(card.amountTo?.amount);
    const fee = num(card.fees?.totalFee?.amount);
    if (!Number.isFinite(receive))
        return null;
    // Selling: the fee is quoted in the fiat we receive, so compare it against what the
    // crypto is worth at their rate. Buying: it is quoted in the fiat we spend.
    const basis = side === "sell" ? num(card.amountFromEquivalent?.amount) : num(card.amountFrom?.amount);
    if (!Number.isFinite(basis) || basis <= 0)
        return null;
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
function paybisSellUrl() {
    return "https://paybis.com/sell-usdc-base/";
}
function paybisBuyUrl(fiat, amount) {
    const qs = new URLSearchParams({ currency: fiat });
    if (amount && amount > 0)
        qs.set("amount", String(amount));
    return `https://paybis.com/buy-usd-coin-solana/?${qs.toString()}`;
}
