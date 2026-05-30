import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  Connection,
  Keypair,
  PublicKey,
} from "@solana/web3.js";

import { DeloraClient } from "./delora.js";
import type { TrackedVault, CrossChainSourceId } from "./types.js";

/**
 * OXAR Delora monitor — SKELETON, not wired, not deployed.
 *
 * NOTE: built on the pre-pivot own-contract model (`crank_nav` on a `Vault` PDA),
 * which v1 does not use. Delora is still planned for cross-chain SWAPS, but in the
 * deposit flow — not this NAV-cranker. See README before reviving. No-op today.
 *
 * Loop:
 *   every CRANK_INTERVAL_SEC seconds:
 *     1. Fetch all `Vault` accounts where yield_source = DeloraCrossChain
 *     2. For each: ask Delora for current NAV
 *     3. If NAV diverges from on-chain by > epsilon → push crank_nav tx
 *     4. Log result, sleep, repeat
 *
 * This file is a runnable skeleton. Step (1)–(3) are stubs that log
 * intent and don't talk to chain yet. Sprint 4 fills them in.
 */

function loadEnv() {
  const required = [
    "SOLANA_RPC_URL",
    "CRANKER_KEYPAIR_PATH",
    "DELORA_API_KEY",
    "DELORA_BASE_URL",
  ];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing env: ${key}`);
    }
  }
  return {
    rpcUrl: process.env.SOLANA_RPC_URL!,
    crankerPath: process.env.CRANKER_KEYPAIR_PATH!,
    deloraKey: process.env.DELORA_API_KEY!,
    deloraUrl: process.env.DELORA_BASE_URL!,
    deloraIntegrator: process.env.DELORA_INTEGRATOR ?? "oxarforoxar",
    intervalSec: (() => {
      const raw = process.env.CRANK_INTERVAL_SEC;
      if (raw === undefined || raw === "") return 3600;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(
          `Invalid CRANK_INTERVAL_SEC=${JSON.stringify(raw)}; expected positive number`,
        );
      }
      return parsed;
    })(),
    allowlist: (process.env.VAULT_ALLOWLIST ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => new PublicKey(s)),
  };
}

function loadCranker(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, "utf-8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

/// STUB — Sprint 4: scan all Vault accounts where yield_source variant is
/// DeloraCrossChain, return TrackedVault[]. Filter by allowlist if set.
async function listDeloraVaults(
  _connection: Connection,
  _allowlist: PublicKey[],
): Promise<TrackedVault[]> {
  return []; // skeleton returns empty
}

/// STUB — Sprint 4: build crank_nav tx with off-chain NAV in remaining_accounts,
/// sign with cranker keypair, send + confirm.
async function pushCrankNav(
  _connection: Connection,
  _cranker: Keypair,
  vault: TrackedVault,
  newNav: bigint,
): Promise<string | null> {
  console.log(
    `  [stub] would crank_nav for vault ${vault.pda.toBase58()} source=${vault.sourceId} new_nav=${newNav}`,
  );
  return null;
}

async function tick(
  connection: Connection,
  cranker: Keypair,
  delora: DeloraClient,
  allowlist: PublicKey[],
) {
  const now = Math.floor(Date.now() / 1000);
  console.log(`\n[${new Date().toISOString()}] tick`);

  const vaults = await listDeloraVaults(connection, allowlist);
  if (vaults.length === 0) {
    console.log("  no Delora-backed vaults yet — sleeping");
    return;
  }

  for (const v of vaults) {
    try {
      const elapsed = Math.max(60, now - 0); // TODO: read vault.last_update_ts
      const quote = await delora.fetchNav(
        v.sourceId as CrossChainSourceId,
        v.navPerShare,
        elapsed,
      );
      if (quote.navPerShare === v.navPerShare) {
        console.log(
          `  vault ${v.pda.toBase58()} source=${v.sourceId} NAV unchanged (${quote.navPerShare})`,
        );
        continue;
      }
      await pushCrankNav(connection, cranker, v, quote.navPerShare);
    } catch (err) {
      console.error(
        `  vault ${v.pda.toBase58()} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

async function main() {
  const env = loadEnv();
  const connection = new Connection(env.rpcUrl, "confirmed");
  const cranker = loadCranker(env.crankerPath);
  const delora = new DeloraClient(
    env.deloraKey,
    env.deloraUrl,
    env.deloraIntegrator,
  );

  console.log(`OXAR Delora monitor`);
  console.log(`  rpc:      ${env.rpcUrl}`);
  console.log(`  cranker:  ${cranker.publicKey.toBase58()}`);
  console.log(`  interval: ${env.intervalSec}s`);
  console.log(`  allowed:  ${env.allowlist.length || "all"} vaults`);

  // Initial tick, then schedule
  await tick(connection, cranker, delora, env.allowlist);
  setInterval(
    () => void tick(connection, cranker, delora, env.allowlist),
    env.intervalSec * 1000,
  );
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
