/**
 * Wait for a balance-like quantity to rise after an on-ramp/card top-up. The
 * payment provider's own confirmation (e.g. Privy's `fund()` / `fundWallet()`)
 * resolves before the money actually lands on-chain — sometimes by several
 * minutes — so callers poll this after that promise settles.
 *
 * It also has to survive the provider promise NEVER settling: if the user backs
 * out of the on-ramp window, there is no "cancelled" result to await, so the
 * caller stops the poll itself via `stopped()` rather than waiting out the full
 * timeout with nothing to show for it.
 */
/** Poll `getCurrent()` until it rises by ≥ `minDelta` from `baseline` (funds
 *  landed), `stopped()` reports true (caller gave up waiting), or `timeoutMs`
 *  elapses. Returns the realized delta in whatever unit `getCurrent` reports
 *  (never negative). */
export declare function pollArrival(getCurrent: () => Promise<number>, baseline: number, minDelta: number, stopped: () => boolean, timeoutMs?: number, intervalMs?: number): Promise<number>;
