"use client";

import { PublicKey, type Connection } from "@solana/web3.js";

import { USDC_MINT } from "@/lib/constants";

/**
 * The wallet's dollars, read straight from the chain.
 *
 * Selling something doesn't say what it fetched — the sale confirms, and the money
 * turns up in the account a moment later. So a purchase paid for by selling has to
 * watch the balance rather than trust an estimate; this is the reading it watches.
 */
export async function readUsdcUsd(connection: Connection, owner: PublicKey): Promise<number> {
  const { value } = await connection.getParsedTokenAccountsByOwner(owner, {
    mint: new PublicKey(USDC_MINT),
  });
  let total = 0;
  for (const { account } of value) {
    const parsed = account.data as unknown as {
      parsed?: { info?: { tokenAmount?: { uiAmount?: number | null } } };
    };
    total += parsed?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
  }
  return total;
}
