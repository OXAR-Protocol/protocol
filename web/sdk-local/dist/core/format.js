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
