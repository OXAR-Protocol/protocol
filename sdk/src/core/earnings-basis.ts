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
export const PENDING_BASIS_MAX_AGE_MS = 30 * 60_000;

/** How much of the delta the indexed basis must move before we stop applying it.
 *  Below 1 because the indexed cost (post-slippage USDC actually spent) differs
 *  from the requested amount by a hair. */
const SETTLED_FRACTION = 0.9;

/** True once the indexed basis has moved far enough toward the delta to own it. */
export function isBasisDeltaSettled(
  delta: PendingBasisDelta,
  indexedBasis: Record<string, number>,
): boolean {
  if (delta.deltaUsd === 0) return true;
  const moved = (indexedBasis[delta.sourceId] ?? 0) - delta.serverBasisAtRecord;
  // Ratio, not absolute: sign-agnostic, so it reads deposits and withdraws alike.
  return moved / delta.deltaUsd >= SETTLED_FRACTION;
}

/** The deltas still worth applying: neither settled by the indexer nor expired.
 *  Returns the INPUT array when nothing was dropped, so callers can tell "nothing
 *  changed" by identity and skip the re-render that would otherwise follow. */
export function pruneBasisDeltas(
  deltas: readonly PendingBasisDelta[],
  indexedBasis: Record<string, number>,
  now: number,
): PendingBasisDelta[] {
  const kept = deltas.filter(
    (d) =>
      now - d.at < PENDING_BASIS_MAX_AGE_MS && !isBasisDeltaSettled(d, indexedBasis),
  );
  return kept.length === deltas.length ? (deltas as PendingBasisDelta[]) : kept;
}

/** Indexed basis + the deltas it hasn't picked up yet. */
export function applyBasisDeltas(
  indexedBasis: Record<string, number>,
  deltas: readonly PendingBasisDelta[],
): Record<string, number> {
  if (deltas.length === 0) return indexedBasis;
  const out = { ...indexedBasis };
  for (const d of deltas) out[d.sourceId] = (out[d.sourceId] ?? 0) + d.deltaUsd;
  return out;
}

/**
 * Merge a new delta into a source's existing one. Keeps the ORIGINAL
 * `serverBasisAtRecord` so the settle check measures the whole run of deposits,
 * and refreshes `at` so an active user's entry doesn't age out mid-session.
 */
export function mergeBasisDelta(
  deltas: readonly PendingBasisDelta[],
  next: PendingBasisDelta,
): PendingBasisDelta[] {
  const prior = deltas.find((d) => d.sourceId === next.sourceId);
  const merged: PendingBasisDelta = prior
    ? { ...prior, deltaUsd: prior.deltaUsd + next.deltaUsd, at: next.at }
    : next;
  return [...deltas.filter((d) => d.sourceId !== next.sourceId), merged];
}
