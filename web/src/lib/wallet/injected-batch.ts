"use client";

import { getWallets } from "@wallet-standard/app";

/** Sign a batch of already-serialized unsigned transactions, in one prompt. */
export type BatchSign = (txBytes: Uint8Array[]) => Promise<Uint8Array[]>;

/**
 * The wallet's own "sign all of these", through the Wallet Standard.
 *
 * Privy's batch overload collapses a basket into ONE confirmation because the
 * confirmation is Privy's own sheet — which exists only for the embedded wallet.
 * For an external one Privy forwards the requests singly, so a basket of two asked
 * for two signatures.
 *
 * The standard has exactly the call that doesn't: `solana:signTransaction` takes an
 * array of inputs and returns one output per input, behind a single approval listing
 * every transaction. Crucially it is defined in BYTES both ways —
 * `{ transaction: Uint8Array } → { signedTransaction: Uint8Array }` — which is the
 * same contract the single-transaction path has always used.
 *
 * That last point is the bug this replaces. The first version called Phantom's older
 * injected `signAllTransactions`, which takes and returns web3.js OBJECTS. Those have
 * to cross an in-app browser's bridge, and what came back was not always an object we
 * could serialize: a basket signed fine and then failed on every row.
 *
 * Best-effort by design. No registered wallet holding this account — mobile over
 * WalletConnect, a locked wallet, another account selected — and the caller keeps
 * Privy's path, which still works and still prompts per transaction.
 */

/** The Solana chain we transact on, as the standard identifies it. */
const CHAIN = "solana:mainnet";
const SIGN_FEATURE = "solana:signTransaction";

interface SignTransactionFeature {
  signTransaction(
    ...inputs: { account: unknown; transaction: Uint8Array; chain?: string }[]
  ): Promise<readonly { signedTransaction: unknown }[]>;
}

export function injectedBatchSign(address: string): BatchSign | null {
  let registered: readonly { features: Record<string, unknown>; accounts: readonly { address: string }[] }[];
  try {
    registered = getWallets().get();
  } catch {
    // No window, no registry — server render, or a browser with nothing injected.
    return null;
  }

  for (const wallet of registered) {
    const feature = wallet.features[SIGN_FEATURE] as SignTransactionFeature | undefined;
    if (typeof feature?.signTransaction !== "function") continue;
    // Only the account we're actually transacting from. A wallet can hold several,
    // and signing with the wrong one produces a transaction nobody can send.
    const account = wallet.accounts.find((a) => a.address === address);
    if (!account) continue;

    return async (txBytes) => {
      const outputs = await feature.signTransaction(
        ...txBytes.map((transaction) => ({ account, transaction, chain: CHAIN })),
      );
      if (!Array.isArray(outputs) || outputs.length !== txBytes.length) {
        throw new Error("The wallet returned a different number of transactions than it was given");
      }
      return outputs.map((o, i) => {
        const bytes = asBytes(o?.signedTransaction);
        if (!bytes) {
          throw new Error(
            `The wallet signed transaction ${i + 1} into a shape we can't send (${describe(o?.signedTransaction)})`,
          );
        }
        return bytes;
      });
    };
  }

  return null;
}

/**
 * The standard says `Uint8Array`, and in the same tab that is what arrives. Across an
 * in-app browser's bridge the same value can turn up as a base64 string, a plain byte
 * array, or a `Buffer` that has been through JSON — so every shape is accepted rather
 * than assumed, and an unrecognised one is named instead of thrown as a TypeError.
 */
function asBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof value === "string") return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  if (Array.isArray(value) && value.every((n) => typeof n === "number")) return Uint8Array.from(value);
  const data = (value as { data?: unknown } | null)?.data;
  if (Array.isArray(data) && data.every((n) => typeof n === "number")) return Uint8Array.from(data);
  // A byte-keyed object — what a Uint8Array becomes when it crosses as plain JSON.
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      return Uint8Array.from(keys.map((k) => (value as Record<string, number>)[k]!));
    }
  }
  return null;
}

/** Enough about the mystery value to fix it next time, and nothing sensitive. */
function describe(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return typeof value;
  const ctor = (value as { constructor?: { name?: string } }).constructor?.name ?? "object";
  return `${ctor}: ${Object.keys(value).slice(0, 6).join(", ") || "no keys"}`;
}
