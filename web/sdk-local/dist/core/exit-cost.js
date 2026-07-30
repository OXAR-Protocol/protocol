"use strict";
/**
 * What leaving would cost, stated before the user buys in.
 *
 * A buy panel shows how many units an amount buys; it doesn't show what selling
 * those units straight back would return. Visa was rejected as an asset over
 * this: it quoted −0.9% on a one-way SELL but cost −4.70% on a full round trip,
 * because the expense sat entirely on the BUY side, invisible on the sell quote
 * alone. Round-trip cost varies a lot by asset (our live shelf spans −0.01% to
 * −3.55% today), so it's worth surfacing per-asset rather than assuming.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exitCostFraction = exitCostFraction;
exports.exitCostBand = exitCostBand;
exports.findExitCeiling = findExitCeiling;
/**
 * Fraction of value lost between what went in and what would come back out on
 * an immediate exit (0.021 = 2.1%). `usdOut` is the SELL quote's proceeds for
 * the equivalent position; `usdIn` is the USD spent to acquire it.
 *
 * Returns `null` — not 0 — for every degenerate case, so callers can't mistake
 * "we don't know" for "this is free": a non-positive/non-finite `usdIn` (nothing
 * was actually spent) and a missing/non-finite `usdOut` (no quote — a failed
 * route or a rate limit, not a zero-cost trade).
 */
function exitCostFraction(usdIn, usdOut) {
    if (usdOut === null || !Number.isFinite(usdOut))
        return null;
    if (!Number.isFinite(usdIn) || usdIn <= 0)
        return null;
    // Clamp at 0: a sell that returns MORE than was spent (a favorable move in the
    // reference price between quotes) is a gain, not a negative cost.
    return Math.max(0, (usdIn - usdOut) / usdIn);
}
/** Fraction lost stops reading as "cheap" and starts reading as "worth a second
 * look" — the pure lend sources round-trip near zero, so anything here already
 * costs a little. */
const CHEAP_MAX = 0.005;
/** Above this, the round trip stops being "a little" and becomes the kind of
 * number that changed a listing decision. Our worst SHIPPED asset today (WMTx)
 * round-trips at ~3.55%; Visa was rejected at −4.70%, clearly past it. This band
 * is drawn to include the worst of what we already carry (2%–3.55%+) as
 * "expensive but real", while flagging it plainly rather than hiding it. */
const NORMAL_MAX = 0.02;
/**
 * Classifies a round-trip fraction against measured reality on our own shelf
 * (−0.01% to −3.55% today, see module docs). `null` → `"none"`: a caller must
 * not read a missing quote as "cheap".
 */
function exitCostBand(fraction) {
    if (fraction === null)
        return "none";
    if (fraction <= CHEAP_MAX)
        return "cheap";
    if (fraction <= NORMAL_MAX)
        return "normal";
    return "expensive";
}
/**
 * Sizes below this aren't worth telling apart — the point is to answer "about
 * how much can I take out", not to find the exact last dollar. $25 is already
 * finer than anyone will act on.
 */
const DEFAULT_RESOLUTION_USD = 25;
/** Hard cap on probe calls. This runs off a debounced keystroke path against a
 * real Jupiter endpoint — an unbounded search would hammer it on every retype. */
const DEFAULT_MAX_PROBES = 6;
/**
 * Bounded binary search for the largest sellable size below a known-failing
 * amount. Assumes sellability is monotonic in size — true of a real order
 * book/AMM: if $225 has no route, smaller sizes are the ones that might.
 *
 * Pure and dependency-injected: the network lives entirely in `probe`, so this
 * unit-tests with a plain function and no mocking. Bounded on both axes — at
 * most `maxProbes` calls, resolution never finer than `resolutionUsd` — so it
 * is safe to run on a debounced input path.
 *
 * NOT retried: Jupiter's free tier returns spurious `NO_ROUTES_FOUND` under
 * load, so any single `probe` failure here could be a flake, not a true depth
 * wall — but a 6-probe binary search has no spare budget to re-check a result
 * without either doubling the cost per keystroke or giving up a step of
 * precision. Rather than pretend the result is exact, we accept that a
 * probe's "no" is trusted as-is and push the hedge to the caller: report the
 * ceiling as an approximate, rounded figure ("about $200", never "$212.37")
 * so a wrong-by-one-flake step reads as the estimate it is, not a promise.
 */
async function findExitCeiling(params) {
    const { upperBoundUsd, probe, resolutionUsd = DEFAULT_RESOLUTION_USD, maxProbes = DEFAULT_MAX_PROBES, } = params;
    if (!Number.isFinite(upperBoundUsd) || upperBoundUsd <= 0 || !Number.isFinite(resolutionUsd) || resolutionUsd <= 0 || maxProbes < 1) {
        return { ceilingUsd: null, probesUsed: 0 };
    }
    let low = 0; // "sell nothing" trivially succeeds — not itself a useful answer.
    let high = upperBoundUsd; // known (or assumed) to fail; never re-probed.
    let ceilingUsd = null;
    let probesUsed = 0;
    while (probesUsed < maxProbes && high - low > resolutionUsd) {
        const mid = Math.round((low + high) / 2 / resolutionUsd) * resolutionUsd;
        if (mid <= low || mid >= high)
            break; // rounding collapsed the interval — done
        probesUsed++;
        // eslint-disable-next-line no-await-in-loop -- inherently sequential: each
        // probe narrows the range the next one searches, so they can't run in parallel.
        const ok = await probe(mid);
        if (ok) {
            low = mid;
            ceilingUsd = mid;
        }
        else {
            high = mid;
        }
    }
    return { ceilingUsd, probesUsed };
}
