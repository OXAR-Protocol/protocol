/**
 * Money as a person reads it.
 *
 * Full float precision leaks into the UI and reads as a malfunction: a balance
 * showed `19.999785` and a P&L showed `−$0.377655`. Two decimals is what a dollar
 * amount looks like — but blind rounding turns a real tiny amount into `$0.00`,
 * which is its own lie, so anything below a cent says so instead.
 */
/** Dollar amount at cent precision, grouped. Sub-cent but non-zero → "<0.01". */
export declare function formatUsdAmount(value: number, maxDigits?: number): string;
/**
 * A signed dollar figure for gains and losses: `+$1.20`, `−$0.06`, `+<$0.01`.
 * Uses a real minus sign, not a hyphen, so it reads as arithmetic.
 */
export declare function formatSignedUsd(value: number, maxDigits?: number): string;
/**
 * Round a dollar amount DOWN to cents, for prefilling an input from a balance:
 * showing `19.999785` is alarming, and rounding UP would offer more than is there.
 */
export declare function floorToCents(value: number): number;
