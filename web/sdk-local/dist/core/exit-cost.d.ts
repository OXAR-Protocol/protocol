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
/** Fraction lost on a round trip, or a qualitative read of it (`"none"` = no
 * usable number — a missing/failed quote, not a good outcome). */
export type ExitCostBand = "cheap" | "normal" | "expensive" | "none";
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
export declare function exitCostFraction(usdIn: number, usdOut: number | null): number | null;
/**
 * Classifies a round-trip fraction against measured reality on our own shelf
 * (−0.01% to −3.55% today, see module docs). `null` → `"none"`: a caller must
 * not read a missing quote as "cheap".
 */
export declare function exitCostBand(fraction: number | null): ExitCostBand;
