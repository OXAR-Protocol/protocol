import { Connection, PublicKey, type ParsedAccountData } from "@solana/web3.js";

import { RPC_URL } from "@/lib/constants";

/**
 * What the wallet holds right now, read from the chain.
 *
 * The portfolio replay walks BACKWARD from this, so it is the one figure everything
 * else is measured against. Inferring it by summing the transactions we happened to
 * fetch would make it agree with the replay by construction and disagree with reality
 * whenever the history is deeper than the window — which is the quiet way for a chart
 * to end somewhere the rest of the screen doesn't.
 */

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

/** UI units by mint — every SPL balance, or only those in `keep`. Both token programs:
 *  USDG and the tokenized stocks are Token-2022, everything older is not. */
export async function readWalletBalances(
  owner: string,
  keep?: ReadonlySet<string>,
): Promise<Record<string, number>> {
  const connection = new Connection(RPC_URL, "confirmed");
  const pk = new PublicKey(owner);
  const balances: Record<string, number> = {};

  const pages = await Promise.all(
    [TOKEN_PROGRAM, TOKEN_2022].map((programId) =>
      connection.getParsedTokenAccountsByOwner(pk, { programId }),
    ),
  );

  for (const page of pages) {
    for (const { account } of page.value) {
      const info = (account.data as ParsedAccountData).parsed?.info;
      const mint: unknown = info?.mint;
      const amount: unknown = info?.tokenAmount?.uiAmount;
      if (typeof mint !== "string" || typeof amount !== "number") continue;
      if (keep && !keep.has(mint)) continue;
      // A mint can sit in more than one token account; the wallet holds the sum.
      balances[mint] = (balances[mint] ?? 0) + amount;
    }
  }

  return balances;
}
