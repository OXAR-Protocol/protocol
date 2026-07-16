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

const KEY = "oxar:pending-bridge";
/** Same-tab signal that the pending record changed (localStorage `storage`
 *  events only fire in OTHER tabs, so the global watcher listens for this). */
export const PENDING_EVENT = "oxar:pending-bridge-changed";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStore(): StorageLike | null {
  return typeof window !== "undefined" ? window.localStorage : null;
}

function notifyChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PENDING_EVENT));
}

export function savePending(p: PendingBridge, store = defaultStore()): void {
  store?.setItem(KEY, JSON.stringify(p));
  notifyChanged();
}

export function loadPending(store = defaultStore()): PendingBridge | null {
  const raw = store?.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingBridge;
  } catch {
    return null;
  }
}

export function clearPending(store = defaultStore()): void {
  store?.removeItem(KEY);
  notifyChanged();
}
