"use client";

import { Transaction, VersionedTransaction } from "@solana/web3.js";

/** Sign a batch of already-serialized unsigned transactions, in one prompt. */
export type BatchSign = (txBytes: Uint8Array[]) => Promise<Uint8Array[]>;

/**
 * The wallet's own "sign all of these" — for the wallets that have one.
 *
 * Privy's batch overload puts a basket behind ONE confirmation, and that is what
 * the embedded wallet does. An external wallet doesn't go through Privy's UI: the
 * request is forwarded to Phantom or Solflare one transaction at a time, so two
 * assets meant two prompts even though the app had asked once. Their injected
 * providers all implement the wallet standard's `signAllTransactions`, which is
 * exactly the missing call — one approval sheet listing every transaction.
 *
 * Best-effort by design. No injected provider (mobile via WalletConnect), a locked
 * wallet, or a different account selected in it → null, and the caller keeps Privy's
 * path, which still works and still prompts per transaction.
 */
interface InjectedProvider {
  publicKey?: { toString(): string } | null;
  signAllTransactions?: (
    txs: (Transaction | VersionedTransaction)[],
  ) => Promise<(Transaction | VersionedTransaction)[]>;
}

/** The providers a browser can have injected, in the order we'd trust them. */
function candidates(): InjectedProvider[] {
  if (typeof window === "undefined") return [];
  const w = window as unknown as Record<string, unknown>;
  const phantom = (w.phantom as { solana?: InjectedProvider } | undefined)?.solana;
  return [phantom, w.solflare, w.backpack, w.solana].filter(
    (p): p is InjectedProvider => !!p && typeof (p as InjectedProvider).signAllTransactions === "function",
  );
}

/**
 * Wire bytes back out, whatever the wallet handed us.
 *
 * This is the part that broke: a basket signed fine — the wallet showed one sheet,
 * the user confirmed it — and then every row reported "something went wrong". The
 * single-transaction path never had this problem because it passes BYTES both ways
 * and the wallet gives bytes back. Objects have to cross the in-app browser's
 * bridge, and what comes back on the other side is not always a `Transaction`: it
 * can be base64, raw bytes, a byte array, or a look-alike carrying its own
 * `serialize`. Trusting `instanceof` there turned a signed basket into a TypeError.
 *
 * Signatures are kept as they are and nothing is re-compiled — a gasless
 * transaction is still missing the relayer's signature at this point, by design.
 */
function toWire(tx: unknown): Uint8Array {
  if (tx instanceof Transaction) {
    return tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  }
  if (tx instanceof VersionedTransaction) return tx.serialize();
  const bytes = asBytes(tx);
  if (bytes) return bytes;
  if (tx && typeof (tx as { serialize?: unknown }).serialize === "function") {
    const out = (tx as { serialize: (o?: unknown) => unknown }).serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const serialized = asBytes(out);
    if (serialized) return serialized;
  }
  throw new Error(`The wallet returned a signed transaction in a shape we can't send (${describe(tx)})`);
}

/** The four shapes a signed transaction arrives in when it isn't an object. */
function asBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === "string") return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) return Uint8Array.from(value);
  // A Buffer that has been through JSON on the way across the bridge.
  const data = (value as { data?: unknown } | null)?.data;
  if (Array.isArray(data) && data.every((n) => typeof n === "number")) return Uint8Array.from(data);
  return null;
}

/** Enough about the mystery object to fix it next time, and nothing sensitive. */
function describe(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return typeof value;
  const ctor = (value as { constructor?: { name?: string } }).constructor?.name ?? "object";
  return `${ctor}: ${Object.keys(value).slice(0, 6).join(", ") || "no keys"}`;
}

/** Legacy or v0, told apart by which parser accepts it rather than by guessing at
 *  a byte — `Transaction.from` refuses a versioned message by name. */
function fromWire(bytes: Uint8Array): Transaction | VersionedTransaction {
  try {
    return Transaction.from(bytes);
  } catch {
    return VersionedTransaction.deserialize(bytes);
  }
}

export function injectedBatchSign(address: string): BatchSign | null {
  const provider = candidates().find((p) => p.publicKey?.toString() === address);
  if (!provider?.signAllTransactions) return null;

  return async (txBytes) => {
    const signed = await provider.signAllTransactions!(txBytes.map(fromWire));
    if (!Array.isArray(signed) || signed.length !== txBytes.length) {
      throw new Error("The wallet returned a different number of transactions than it was given");
    }
    return signed.map(toWire);
  };
}
