/**
 * One place for resilient HTTP to the external services the money path leans on
 * (Jupiter swap/price, DefiLlama, Alchemy, Helius). Adds a per-attempt timeout and
 * bounded exponential backoff on transient failures (network error, 429, 5xx) — so
 * a hiccup retries instead of surfacing as a user-facing error. Non-transient
 * responses (4xx other than 429) return immediately; the caller decides.
 */
export interface RetryOptions {
    /** Extra attempts after the first (default 2 → up to 3 total). */
    retries?: number;
    /** Per-attempt timeout in ms (default 8000). */
    timeoutMs?: number;
    /** Base backoff in ms; attempt n waits base·2^n (default 300). */
    backoffMs?: number;
}
/** True for statuses worth retrying (rate-limit + transient server errors). */
export declare function isRetryableStatus(status: number): boolean;
/**
 * `fetch` with a timeout and bounded retry/backoff on transient failures. Resolves
 * with the Response (even a final non-ok one) so callers keep their own `res.ok`
 * handling; throws only if every attempt errors/aborts.
 */
export declare function fetchWithRetry(input: string, init?: RequestInit, opts?: RetryOptions): Promise<Response>;
