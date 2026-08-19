/**
 * Who may use our RPC key, and for what.
 *
 * Split out of the route so both guards can be tested without standing up a
 * request: getting either of them subtly wrong turns a fix for a leaked key into a
 * free public RPC we pay for.
 */

/** Methods the app actually calls. Anything else is either someone else's traffic or
 *  a scan we don't want to fund — `getProgramAccounts` in particular walks whole
 *  programs and is the classic way to burn a quota in one request. */
const ALLOWED_METHODS = new Set([
  "getAccountInfo",
  "getMultipleAccounts",
  "getBalance",
  "getLatestBlockhash",
  "getSignatureStatuses",
  "getSignaturesForAddress",
  "getSlot",
  "getTokenAccountBalance",
  "getTokenAccountsByOwner",
  "getTransaction",
  "getFeeForMessage",
  "getMinimumBalanceForRentExemption",
  "getRecentPrioritizationFees",
  "isBlockhashValid",
  "sendTransaction",
  "simulateTransaction",
]);

/** True when the browser that sent this is looking at this same deployment.
 *
 *  A missing Origin is allowed on purpose: same-origin `fetch` from a page doesn't
 *  always send one, and the wallet library is not going to start. The header is a
 *  filter against other sites' pages, which DO get one attached and cannot forge it
 *  — not an authentication check, which is what the method list is for. */
export function isSameOrigin(origin: string | null, requestUrl: string): boolean {
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(requestUrl).host;
  } catch {
    return false;
  }
}

/** One JSON-RPC call, of a method the app makes. Batches are refused rather than
 *  unpacked: nothing here sends them, so accepting them only widens what a stranger
 *  can ask for in a single request. */
export function isAllowedRpcBody(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const method = (body as { method?: unknown }).method;
  return typeof method === "string" && ALLOWED_METHODS.has(method);
}
