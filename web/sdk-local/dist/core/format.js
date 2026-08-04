"use strict";
/**
 * Money as a person reads it.
 *
 * Full float precision leaks into the UI and reads as a malfunction: a balance
 * showed `19.999785` and a P&L showed `−$0.377655`. Two decimals is what a dollar
 * amount looks like — but blind rounding turns a real tiny amount into `$0.00`,
 * which is its own lie, so anything below a cent says so instead.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatUsdAmount = formatUsdAmount;
exports.formatSignedUsd = formatSignedUsd;
exports.floorToCents = floorToCents;
exports.centPrecision = centPrecision;
exports.floorTo = floorTo;
exports.normalizeDecimalInput = normalizeDecimalInput;
exports.compactUsd = compactUsd;
/** Dollar amount at cent precision, grouped. Sub-cent but non-zero → "<0.01". */
function formatUsdAmount(value, maxDigits = 2) {
    if (!Number.isFinite(value))
        return "0.00";
    const abs = Math.abs(value);
    // Below what `maxDigits` can express, but not actually nothing.
    const smallest = 10 ** -maxDigits;
    if (abs > 0 && abs < smallest)
        return `<${smallest.toFixed(maxDigits)}`;
    return abs.toLocaleString("en-US", {
        minimumFractionDigits: maxDigits,
        maximumFractionDigits: maxDigits,
    });
}
/**
 * A signed dollar figure for gains and losses: `+$1.20`, `−$0.06`, `+<$0.01`.
 * Uses a real minus sign, not a hyphen, so it reads as arithmetic.
 */
function formatSignedUsd(value, maxDigits = 2) {
    const sign = value < 0 ? "−" : "+";
    return `${sign}$${formatUsdAmount(value, maxDigits)}`;
}
/**
 * Round a dollar amount DOWN to cents, for prefilling an input from a balance:
 * showing `19.999785` is alarming, and rounding UP would offer more than is there.
 */
function floorToCents(value) {
    return Number.isFinite(value) ? Math.floor(value * 100) / 100 : 0;
}
/**
 * How many decimals a token amount needs so that flooring it strands less than a
 * cent. USDC (≈$1) needs 2; SOL (≈$180) needs 5, where 2 would abandon ~$2 of it.
 *
 * Prefilling MAX with a token's full precision is what put `4,84121` in a deposit
 * field — true, and unreadable. Cutting everything to two decimals would be
 * readable and would quietly leave value behind. This is the smallest number of
 * digits that is both.
 */
function centPrecision(priceUsd, maxDecimals = 9) {
    if (!Number.isFinite(priceUsd) || priceUsd <= 0)
        return 2;
    return Math.min(Math.max(Math.ceil(Math.log10(priceUsd / 0.01)), 0), maxDecimals);
}
/** Floor to `decimals` — never up, so a prefilled MAX can't exceed the balance. */
function floorTo(value, decimals) {
    if (!Number.isFinite(value))
        return 0;
    const f = 10 ** Math.max(0, decimals);
    return Math.floor(value * f) / f;
}
/**
 * A typed amount, cleaned. Browsers render `<input type="number">` with the OS
 * locale's separator, so a Ukrainian keyboard shows — and produces — `4,84121`;
 * `Number("4,84")` is NaN. Accepts either separator, keeps one, drops the rest.
 */
function normalizeDecimalInput(raw) {
    const cleaned = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const [whole, ...rest] = cleaned.split(".");
    return rest.length ? `${whole}.${rest.join("")}` : whole;
}
/**
 * A big number at a glance: `$143M`, `$1.4B`, `$920K`. For trust signals, where
 * the magnitude is the whole message and the digits after it are noise.
 */
function compactUsd(value) {
    if (!Number.isFinite(value))
        return "$0";
    if (value >= 1e9)
        return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6)
        return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3)
        return `$${Math.round(value / 1e3)}K`;
    return `$${Math.round(value)}`;
}
