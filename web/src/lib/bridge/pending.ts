/**
 * A cross-chain deposit in flight. Delora has no status/ref-id endpoint, so we
 * track arrival on the DESTINATION (Solana): persist what we expect and the
 * baseline USDC balance, then poll until the USDC lands and deposit it. Survives
 * reloads so funds are never "lost" mid-bridge.
 */
export interface PendingBridge {
  /** Yield provider to deposit into once USDC arrives. */
  providerId: string;
  originChainId: number;
  /** Origin-chain tx hash — shown to the user as proof of "funds in transit". */
  originTxHash: string;
  /** Destination token mint on Solana (the market's asset: USDC / USDG / USDT). */
  mint: string;
  /** Guaranteed-min tokens out (base units) — what we deposit on arrival. */
  expectedUsdc: string;
  /** Destination-token balance at submit time (base units) — arrival = balance rises. */
  baselineUsdc: string;
  /** Solana receiver address. */
  receiver: string;
  bridgeScan?: string;
  createdAt: number;
  /** Failed auto-deposit attempts after the bridged funds arrived. >0 = the funds
   *  are in the wallet but the final deposit/swap didn't complete (surface + retry,
   *  never silently strand). */
  attempts?: number;
}

// A QUEUE of in-flight bridges (JSON array), keyed by `originTxHash`. It used to be
// a single record, so firing a second cross-chain deposit before the first finished
// OVERWROTE it → all but the last bridged to USDC and never auto-deposited (stranded
// as USDC, no retry). The queue drains head-first: the watcher polls/deposits the
// head, clears it, and the next becomes head — nothing is clobbered.
const KEY = "oxar:pending-bridge";
/** Same-tab signal that the pending queue changed (localStorage `storage`
 *  events only fire in OTHER tabs, so the global watcher listens for this). */
export const PENDING_EVENT = "oxar:pending-bridge-changed";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStore(): StorageLike | null {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function notifyChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PENDING_EVENT));
}

function readAll(store: StorageLike | null): PendingBridge[] {
  const raw = store?.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PendingBridge[];
    // Back-compat: an older single-object record → treat as a one-item queue.
    if (parsed && typeof parsed === "object") return [parsed as PendingBridge];
    return [];
  } catch {
    return [];
  }
}

function writeAll(list: PendingBridge[], store: StorageLike | null): void {
  if (list.length === 0) store?.removeItem(KEY);
  else store?.setItem(KEY, JSON.stringify(list));
  notifyChanged();
}

/** Queue a bridge, or update one already queued (same `originTxHash` — e.g. bumping
 *  `attempts` after a failed deposit). Never clobbers a DIFFERENT in-flight bridge. */
export function savePending(p: PendingBridge, store = defaultStore()): void {
  const list = readAll(store);
  const i = list.findIndex((r) => r.originTxHash === p.originTxHash);
  if (i >= 0) list[i] = p;
  else list.push(p);
  writeAll(list, store);
}

/** Its auto-deposit failed after arrival — it needs a human, not another poll. */
const isStuck = (r: PendingBridge) => (r.attempts ?? 0) > 0;

/** The head of the queue — the bridge currently being worked. */
export function loadPending(store = defaultStore()): PendingBridge | null {
  return readAll(store)[0] ?? null;
}

/**
 * The bridge the watcher should work next: the first one that has NOT failed.
 * Deliberately not the head — a stuck record waits for a manual Retry, and if the
 * watcher read the head it would sit on that record and poll nothing, so a second,
 * perfectly healthy bridge queued behind it never arrived and never deposited.
 */
export function loadActivePending(store = defaultStore()): PendingBridge | null {
  return readAll(store).find((r) => !isStuck(r)) ?? null;
}

/** The first bridge whose funds landed but whose deposit failed — Retry material. */
export function loadStuckPending(store = defaultStore()): PendingBridge | null {
  return readAll(store).find(isStuck) ?? null;
}

/** How many are still moving vs. waiting for a human — both are worth showing. */
export function countPending(store = defaultStore()): { active: number; stuck: number } {
  const list = readAll(store);
  const stuck = list.filter(isStuck).length;
  return { active: list.length - stuck, stuck };
}

/** Move a bridge to the head so it's worked next — a Retry has to act now, not
 *  after every other queued bridge finishes. No-op if it's already there. */
export function promotePending(originTxHash: string, store = defaultStore()): void {
  const list = readAll(store);
  const i = list.findIndex((r) => r.originTxHash === originTxHash);
  if (i <= 0) return;
  const [rec] = list.splice(i, 1);
  writeAll([rec, ...list], store);
}

/** The whole queue (for surfacing "N deposits in flight"). */
export function loadAllPending(store = defaultStore()): PendingBridge[] {
  return readAll(store);
}

/** Drop a bridge from the queue. With an `originTxHash`, removes that one; without,
 *  removes the HEAD (the record just finished) — the next becomes head. */
export function clearPending(originTxHash?: string, store = defaultStore()): void {
  const list = readAll(store);
  const next =
    typeof originTxHash === "string"
      ? list.filter((r) => r.originTxHash !== originTxHash)
      : list.slice(1);
  writeAll(next, store);
}
