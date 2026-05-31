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
  /** Guaranteed-min USDC out (base units) — what we deposit on arrival. */
  expectedUsdc: string;
  /** Solana USDC balance at submit time (base units) — arrival = balance rises. */
  baselineUsdc: string;
  /** Solana receiver address. */
  receiver: string;
  bridgeScan?: string;
  createdAt: number;
}

const KEY = "oxar:pending-bridge";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStore(): StorageLike | null {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function savePending(p: PendingBridge, store = defaultStore()): void {
  store?.setItem(KEY, JSON.stringify(p));
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
}
