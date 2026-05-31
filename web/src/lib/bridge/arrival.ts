import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

/** USDC balance (base units) of an owner's ATA; 0 if the account doesn't exist. */
export async function readUsdcBase(
  connection: Connection,
  owner: PublicKey,
  mint: string,
): Promise<bigint> {
  try {
    const ata = await getAssociatedTokenAddress(new PublicKey(mint), owner);
    const account = await getAccount(connection, ata);
    return account.amount;
  } catch {
    return BigInt(0);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Poll the destination USDC balance until it rises by at least `expected` over
 * `baseline` (= the bridged funds landed), or until timeout. Returns true on
 * arrival. Bridges via RELAY are usually seconds; we allow a generous window.
 */
export async function pollUsdcArrival(params: {
  connection: Connection;
  owner: PublicKey;
  mint: string;
  baseline: bigint;
  expected: bigint;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: { aborted: boolean };
}): Promise<boolean> {
  const { connection, owner, mint, baseline, expected } = params;
  const intervalMs = params.intervalMs ?? 4000;
  const timeoutMs = params.timeoutMs ?? 10 * 60 * 1000; // 10 min
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (params.signal?.aborted) return false;
    const current = await readUsdcBase(connection, owner, mint);
    if (current - baseline >= expected) return true;
    await sleep(intervalMs);
  }
  return false;
}
