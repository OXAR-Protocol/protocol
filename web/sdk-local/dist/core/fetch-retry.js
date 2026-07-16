"use strict";
/**
 * One place for resilient HTTP to the external services the money path leans on
 * (Jupiter swap/price, DefiLlama, Alchemy, Helius). Adds a per-attempt timeout and
 * bounded exponential backoff on transient failures (network error, 429, 5xx) — so
 * a hiccup retries instead of surfacing as a user-facing error. Non-transient
 * responses (4xx other than 429) return immediately; the caller decides.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRetryableStatus = isRetryableStatus;
exports.fetchWithRetry = fetchWithRetry;
/** True for statuses worth retrying (rate-limit + transient server errors). */
function isRetryableStatus(status) {
    return status === 429 || (status >= 500 && status <= 599);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/**
 * `fetch` with a timeout and bounded retry/backoff on transient failures. Resolves
 * with the Response (even a final non-ok one) so callers keep their own `res.ok`
 * handling; throws only if every attempt errors/aborts.
 */
async function fetchWithRetry(input, init, opts = {}) {
    const { retries = 2, timeoutMs = 8000, backoffMs = 300 } = opts;
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(input, { ...init, signal: controller.signal });
            clearTimeout(timer);
            if (isRetryableStatus(res.status) && attempt < retries) {
                await sleep(backoffMs * 2 ** attempt);
                continue;
            }
            return res;
        }
        catch (e) {
            clearTimeout(timer);
            lastErr = e;
            if (attempt < retries) {
                await sleep(backoffMs * 2 ** attempt);
                continue;
            }
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error("fetch failed after retries");
}
