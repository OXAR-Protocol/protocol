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
/**
 * How many decimals a token amount needs so that flooring it strands less than a
 * cent. USDC (≈$1) needs 2; SOL (≈$180) needs 5, where 2 would abandon ~$2 of it.
 *
 * Prefilling MAX with a token's full precision is what put `4,84121` in a deposit
 * field — true, and unreadable. Cutting everything to two decimals would be
 * readable and would quietly leave value behind. This is the smallest number of
 * digits that is both.
 */
export declare function centPrecision(priceUsd: number, maxDecimals?: number): number;
/** Floor to `decimals` — never up, so a prefilled MAX can't exceed the balance. */
export declare function floorTo(value: number, decimals: number): number;
/**
 * A typed amount, cleaned. Browsers render `<input type="number">` with the OS
 * locale's separator, so a Ukrainian keyboard shows — and produces — `4,84121`;
 * `Number("4,84")` is NaN. Accepts either separator, keeps one, drops the rest.
 */
export declare function normalizeDecimalInput(raw: string): string;
/**
 * A big number at a glance: `$143M`, `$1.4B`, `$920K`. For trust signals, where
 * the magnitude is the whole message and the digits after it are noise.
 */
export declare function compactUsd(value: number): string;
