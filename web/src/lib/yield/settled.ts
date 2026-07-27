import type { Connection, PublicKey } from "@solana/web3.js";

import { tokenDelta } from "@oxar/sdk";

/**
 * How much of `mint` actually landed in `owner`'s wallet in transaction `sig`.
 *
 * Read from the confirmed transaction, so the success screen can report what
 * settled rather than what was requested — a sell quoted at $4.94 delivered $4.84,
 * and echoing the request made the receipt wrong.
 *
 * Returns `null` when the transaction can't be read yet; callers fall back to the
 * requested figure rather than showing nothing.
 */
export async function settledAmount(
  connection: Connection,
  sig: string,
  owner: PublicKey,
  mint: string,
): Promise<bigint | null> {
  // "confirmed" is already reached before this runs, but the parsed transaction can
  // trail it by a beat — one retry covers that without stalling the screen.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const tx = await connection.getParsedTransaction(sig, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      if (tx?.meta) {
        return tokenDelta(
          tx.meta.preTokenBalances,
          tx.meta.postTokenBalances,
          owner.toBase58(),
          mint,
        );
      }
    } catch {
      // fall through to the retry / null
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1200));
  }
  return null;
}
