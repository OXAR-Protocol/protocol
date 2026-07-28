/**
 * Fit a set of per-asset amounts into the money that actually turned up.
 *
 * Buying several assets with something other than the settlement currency means one
 * conversion followed by N purchases. The conversion never delivers exactly what was
 * quoted — slippage, fees and the guaranteed-minimum output all land it slightly
 * lower. Spending the ORIGINALLY requested amounts against that smaller balance
 * works for every purchase but the last, which fails for want of a few cents. So the
 * shares are kept and the total is shrunk to what arrived.
 *
 * It only ever scales DOWN: if more arrived than was asked for, the user asked for
 * specific amounts and gets them, and the remainder stays in the wallet.
 *
 * Every amount is floored to the cent, so the sum can only come in UNDER `availableUsd`
 * — rounding up here would recreate the exact failure this exists to prevent.
 */
export declare function rescaleAllocations(amounts: Record<string, number>, availableUsd: number): Record<string, number>;
