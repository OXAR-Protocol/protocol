/**
 * Human amount → base units, computed EXACTLY via string/bigint (never
 * `amount * 10**decimals`, which loses precision at high decimals — 10**18 is not
 * exactly representable as a double). Accepts a decimal string (preferred) or a
 * number. Precision finer than `decimals` is truncated (floor) so we never
 * over-credit. Throws on negative or non-numeric input.
 *
 * e.g. toBaseUnits("50", 6) → 50_000_000n, toBaseUnits("0.000001", 6) → 1n.
 */
export declare function toBaseUnits(amount: string | number, decimals: number): bigint;
/**
 * The same conversion, for text a person is still typing.
 *
 * `toBaseUnits` THROWS on anything that isn't a finished number — and "0." is what
 * every amount field holds for the moment between the zero and the cents. Called
 * during a render (to size a quote, to enable a button), that throw takes the whole
 * screen down: on a phone the browser just says the page couldn't load.
 *
 * So: null for input that isn't a number yet, and let the caller treat that as zero.
 */
export declare function toBaseUnitsPartial(amount: string, decimals: number): bigint | null;
/**
 * Base units → human number, for DISPLAY only (e.g. 50_000_000n → 50). Uses float
 * division, so don't round-trip large/high-decimal balances back into on-chain
 * amounts — use the provider's share balance for that (see `redeemAll`).
 */
export declare function fromBaseUnits(amount: bigint, decimals: number): number;
