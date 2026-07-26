/**
 * Cost-basis reconciliation for the earnings view.
 *
 * `earned = current position value − net invested`. The value is read on-chain and
 * moves the instant a deposit lands; the net invested comes from the wallet's
 * INDEXED history, which lags — response caches plus indexing delay. Reading the
 * fresh value against a stale basis is what made a $50 top-up render as "+$50
 * earned": the deposit itself looked like profit.
 *
 * A deposit's effect on the basis is known exactly at send time (+ the USD
 * deposited; a withdraw is the same in reverse), so the delta is held here until
 * the indexed basis catches up, then dropped. Deltas also expire, so one the
 * indexer never confirms cannot mask a real attribution bug forever.
 *
 * Deltas are per (owner, source) and accumulate: two quick top-ups make one entry
 * measured against the same pre-deposit basis, so a partially-caught-up indexer
 * can't settle the pair early.
 */
export interface PendingBasisDelta {
    readonly sourceId: string;
    /** USD added to (deposit) or removed from (withdraw) the net invested. */
    readonly deltaUsd: number;
    /** Indexed basis for this source when the delta was first recorded. */
    readonly serverBasisAtRecord: number;
    /** Unix ms of the most recent record for this source. */
    readonly at: number;
}
/** Drop a delta the indexer never confirmed, rather than skew the figure forever. */
export declare const PENDING_BASIS_MAX_AGE_MS: number;
/** True once the indexed basis has moved far enough toward the delta to own it. */
export declare function isBasisDeltaSettled(delta: PendingBasisDelta, indexedBasis: Record<string, number>): boolean;
/** The deltas still worth applying: neither settled by the indexer nor expired.
 *  Returns the INPUT array when nothing was dropped, so callers can tell "nothing
 *  changed" by identity and skip the re-render that would otherwise follow. */
export declare function pruneBasisDeltas(deltas: readonly PendingBasisDelta[], indexedBasis: Record<string, number>, now: number): PendingBasisDelta[];
/** Indexed basis + the deltas it hasn't picked up yet. */
export declare function applyBasisDeltas(indexedBasis: Record<string, number>, deltas: readonly PendingBasisDelta[]): Record<string, number>;
/**
 * Merge a new delta into a source's existing one. Keeps the ORIGINAL
 * `serverBasisAtRecord` so the settle check measures the whole run of deposits,
 * and refreshes `at` so an active user's entry doesn't age out mid-session.
 */
export declare function mergeBasisDelta(deltas: readonly PendingBasisDelta[], next: PendingBasisDelta): PendingBasisDelta[];
