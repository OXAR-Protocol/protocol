"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBaseUnits = toBaseUnits;
exports.fromBaseUnits = fromBaseUnits;
/**
 * Human amount → base units, computed EXACTLY via string/bigint (never
 * `amount * 10**decimals`, which loses precision at high decimals — 10**18 is not
 * exactly representable as a double). Accepts a decimal string (preferred) or a
 * number. Precision finer than `decimals` is truncated (floor) so we never
 * over-credit. Throws on negative or non-numeric input.
 *
 * e.g. toBaseUnits("50", 6) → 50_000_000n, toBaseUnits("0.000001", 6) → 1n.
 */
function toBaseUnits(amount, decimals) {
    const s = (typeof amount === "number" ? numberToDecimalString(amount) : amount).trim();
    if (!/^\d+(\.\d+)?$/.test(s)) {
        throw new Error(`Invalid amount: ${String(amount)}`);
    }
    const [whole, frac = ""] = s.split(".");
    const fracTruncated = (frac + "0".repeat(decimals)).slice(0, decimals);
    const scale = BigInt("1" + "0".repeat(decimals)); // 10**decimals, no float / no bigint literal
    return BigInt(whole) * scale + BigInt(fracTruncated || "0");
}
/**
 * Base units → human number, for DISPLAY only (e.g. 50_000_000n → 50). Uses float
 * division, so don't round-trip large/high-decimal balances back into on-chain
 * amounts — use the provider's share balance for that (see `redeemAll`).
 */
function fromBaseUnits(amount, decimals) {
    return Number(amount) / 10 ** decimals;
}
/** Plain decimal string for a number, avoiding exponential notation (e.g. 9e-7). */
function numberToDecimalString(n) {
    if (!Number.isFinite(n))
        throw new Error(`Invalid amount: ${n}`);
    const s = n.toString();
    if (!s.includes("e") && !s.includes("E"))
        return s;
    // Expand exponent form; 18 fractional digits covers every asset we support.
    return n.toFixed(18).replace(/\.?0+$/, "");
}
