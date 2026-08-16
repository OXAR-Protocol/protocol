"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BROKEN_MARKET_IMPACT = void 0;
exports.swapPriceImpact = swapPriceImpact;
exports.priceImpactTooHigh = priceImpactTooHigh;
exports.getSwapQuote = getSwapQuote;
exports.buildSwapTx = buildSwapTx;
exports.deserializeSwapTx = deserializeSwapTx;
/**
 * Jupiter swap (in-Solana) for the deposit router: quote an exact-in swap of any
 * SPL/SOL into USDC, then build the swap transaction. The wallet signs+sends it;
 * the router then deposits the realized USDC.
 *
 * `asLegacy`: build a LEGACY (non-versioned) transaction. External wallets
 * (Phantom/Trust, esp. mobile) mishandle Jupiter's default v0 tx and broadcast
 * malformed bytes ("failed to deserialize VersionedTransaction"); legacy txs are
 * universally signable. The embedded wallet keeps v0 (better routing, no size cap).
 */
const web3_js_1 = require("@solana/web3.js");
const fetch_retry_1 = require("./fetch-retry");
const QUOTE_URL = "https://lite-api.jup.ag/swap/v1/quote";
const SWAP_URL = "https://lite-api.jup.ag/swap/v1/swap";
/** Price impact as a fraction (0.01 = 1%). */
function swapPriceImpact(quote) {
    const pct = Number(quote.priceImpactPct);
    return Number.isFinite(pct) ? pct : 0;
}
/** True if the swap's price impact exceeds the cap (default 1.5%). */
function priceImpactTooHigh(quote, maxFraction = 0.015) {
    return swapPriceImpact(quote) > maxFraction;
}
/**
 * Sanity stop for trading a HELD asset (stocks, gold, swap-and-hold yield): at this
 * level the quote isn't expensive, it's broken — a dried-up pool or a bad route —
 * and the fill wouldn't resemble the value we showed the user.
 *
 * Far above the 1.5% default, and deliberately so. What a trade costs is the user's
 * call, and the UI now shows it before they sign; blocking on cost instead LOCKED
 * HOLDERS IN, because on a thin market a sell costs ~2% at every size, so the
 * "try a smaller amount" advice couldn't work. Relaxing it is cheap: on liquid
 * tickers impact is ~0.02%, so this never fires for them.
 */
exports.BROKEN_MARKET_IMPACT = 0.1;
/** Quote an exact-in swap `inputMint → outputMint` for `amount` (base units). */
async function getSwapQuote(params) {
    const { inputMint, outputMint, amount, slippageBps = 50, asLegacy = false, platformFeeBps } = params;
    let url = `${QUOTE_URL}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount.toString()}&slippageBps=${slippageBps}`;
    if (asLegacy)
        url += "&asLegacyTransaction=true";
    // The quote has to know: Jupiter prices the route net of the fee, so asking for it
    // only at build time would quote one number and deliver another.
    if (platformFeeBps && platformFeeBps > 0)
        url += `&platformFeeBps=${platformFeeBps}`;
    const res = await (0, fetch_retry_1.fetchWithRetry)(url);
    if (!res.ok)
        throw new Error(`Swap quote failed (${res.status})`);
    return (await res.json());
}
/** Build the swap transaction (base64) for a quote + owner. v0 by default; legacy when asked. */
async function buildSwapTx(quote, ownerBase58, 
/** `feeAccount` — the token account that receives the platform fee. Required
 *  whenever the quote carried `platformFeeBps`; Jupiter rejects the pair
 *  otherwise, and its mint must be one side of the swap. */
opts) {
    const body = {
        quoteResponse: quote,
        userPublicKey: ownerBase58,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: false,
    };
    if (opts?.asLegacy)
        body.asLegacyTransaction = true;
    if (opts?.feeAccount)
        body.feeAccount = opts.feeAccount;
    const res = await (0, fetch_retry_1.fetchWithRetry)(SWAP_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(`Swap build failed (${res.status})`);
    const json = (await res.json());
    if (!json.swapTransaction)
        throw new Error("Swap build returned no transaction");
    return json.swapTransaction;
}
/** Deserialize Jupiter's base64 swap tx — legacy `Transaction` or v0 `VersionedTransaction`. */
function deserializeSwapTx(b64, asLegacy) {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return asLegacy ? web3_js_1.Transaction.from(bytes) : web3_js_1.VersionedTransaction.deserialize(bytes);
}
