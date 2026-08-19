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

/** Wire bytes back out, with the signatures that are there and no complaint about
 *  the ones that aren't — a gasless transaction is still missing the relayer's. */
function toWire(tx: Transaction | VersionedTransaction): Uint8Array {
  return tx instanceof Transaction
    ? tx.serialize({ requireAllSignatures: false, verifySignatures: false })
    : tx.serialize();
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
    if (signed.length !== txBytes.length) {
      throw new Error("The wallet returned a different number of transactions than it was given");
    }
    return signed.map(toWire);
  };
}
