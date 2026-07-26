import {
  applyBasisDeltas,
  mergeBasisDelta,
  pruneBasisDeltas,
  type PendingBasisDelta,
} from "@oxar/sdk";

/**
 * Store for cost-basis deltas the indexer hasn't caught up with yet — see
 * `@oxar/sdk` `core/earnings-basis` for the reconciliation rules and why they
 * exist. This file holds the state and the change signal a mounted React view
 * subscribes to; the math is in the SDK so mobile shares it.
 *
 * Deltas are PERSISTED (like `lib/bridge/pending`): the window they cover is the
 * indexer's, so a reload inside it must not resurrect the bug they fix. The
 * indexed basis itself stays in memory — it is re-fetched on mount anyway.
 */

type Basis = Record<string, number>;

const KEY = "oxar:pending-basis";

const indexed = new Map<string, Basis>();
const pending = new Map<string, PendingBasisDelta[]>();
const listeners = new Set<() => void>();
let hydrated = false;
let version = 0;

function bump() {
  version += 1;
  for (const l of listeners) l();
}

function readStored(): Record<string, PendingBasisDelta[]> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, PendingBasisDelta[]>) : {};
  } catch {
    return {};
  }
}

function writeStored(): void {
  if (typeof window === "undefined") return;
  try {
    if (pending.size === 0) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(pending)));
  } catch {
    // Private mode / quota — deltas still work for this session.
  }
}

/** Deltas for `owner`, loading what a previous page load left behind once. */
function pendingFor(owner: string): PendingBasisDelta[] {
  if (!hydrated) {
    for (const [o, list] of Object.entries(readStored())) pending.set(o, list);
    hydrated = true;
  }
  return pending.get(owner) ?? [];
}

function setPendingFor(owner: string, list: PendingBasisDelta[]): void {
  if (list.length) pending.set(owner, list);
  else pending.delete(owner);
  writeStored();
}

const sameBasis = (a: Basis | undefined, b: Basis): boolean =>
  !!a && Object.keys(b).length === Object.keys(a).length && Object.keys(b).every((k) => a[k] === b[k]);

/** Monotonic counter — the `useSyncExternalStore` snapshot. */
export function basisVersion(): number {
  return version;
}

export function subscribeBasis(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Record what `/api/earnings` reported, retiring any delta it now covers. */
export function setIndexedBasis(owner: string, basis: Basis): void {
  const live = pendingFor(owner);
  const kept = live.length ? pruneBasisDeltas(live, basis, Date.now()) : live;
  // A remount inside the response cache re-reports identical data — don't re-render for it.
  if (sameBasis(indexed.get(owner), basis) && kept === live) return;
  indexed.set(owner, basis);
  if (kept !== live) setPendingFor(owner, kept);
  bump();
}

/**
 * Note a just-sent deposit (`deltaUsd > 0`) or withdraw (`< 0`) against a source.
 * Held until the indexed basis reflects it — see `pruneBasisDeltas`.
 */
export function recordBasisDelta(owner: string, sourceId: string, deltaUsd: number): void {
  if (!Number.isFinite(deltaUsd) || deltaUsd === 0) return;
  setPendingFor(
    owner,
    mergeBasisDelta(pendingFor(owner), {
      sourceId,
      deltaUsd,
      serverBasisAtRecord: indexed.get(owner)?.[sourceId] ?? 0,
      at: Date.now(),
    }),
  );
  bump();
}

/** Whether `/api/earnings` has answered for this wallet yet (drives `loading`). */
export function hasIndexedBasis(owner: string): boolean {
  return indexed.has(owner);
}

/** Indexed basis for `owner` plus whatever the indexer hasn't picked up yet. */
export function effectiveBasis(owner: string): Basis {
  const base = indexed.get(owner) ?? {};
  const live = pendingFor(owner);
  if (!live.length) return base;
  return applyBasisDeltas(base, pruneBasisDeltas(live, base, Date.now()));
}

/** Test seam — drops all state, stored and in memory. */
export function resetPendingBasis(): void {
  indexed.clear();
  pending.clear();
  listeners.clear();
  hydrated = false;
  version = 0;
  writeStored();
}
