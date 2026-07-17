#!/usr/bin/env node
/**
 * Regenerate the `allowed_programs` list in kora.toml.
 *
 * Kora only pays gas for programs on its allowlist. Swaps route through Jupiter, which
 * adds new AMMs over time — so the AMM set has to be refreshed or new tokens' swaps fall
 * back to native gas (and fail for 0-SOL users). This script rebuilds the list from:
 *   BASE      — SPL / system / ATA / ALT / compute-budget (never changes)
 *   PROTOCOLS — the protocols we integrate directly (Jupiter Lend, Kamino, + partners)
 *   Jupiter   — every AMM Jupiter currently routes through (live program-id-to-label)
 *
 * USAGE:  node scripts/refresh-allowlist.mjs        # rewrites kora.toml in place
 *         node scripts/refresh-allowlist.mjs --check # exit 1 if it WOULD change (for CI)
 * After a change, redeploy the node:  railway up --service kora
 *
 * To add a partner protocol (a company that gives us direct Solana access — no Jupiter),
 * add its program id(s) to PROTOCOLS below and re-run. That's all gasless needs.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const JUPITER_PROGRAMS_URL = "https://lite-api.jup.ag/swap/v1/program-id-to-label";
const TOML_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "kora.toml");
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const BASE = [
  ["11111111111111111111111111111111", "System"],
  ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "SPL Token"],
  ["TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", "Token-2022"],
  ["ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", "Associated Token Account"],
  ["AddressLookupTab1e1111111111111111111111111", "Address Lookup Table"],
  ["ComputeBudget111111111111111111111111111111", "Compute Budget"],
];

// Protocols we integrate directly (NOT via Jupiter routing). Add partner programs here.
const PROTOCOLS = [
  ["jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9", "Jupiter Lend"],
  ["jup7TthsMgcR9Y3L277b8Eo9uboVSmu1utkuXHNUKar", "Jupiter Lend"],
  ["jup8QcdtqecBGw1iXHW3hQAsHQbTgEqbLbNMvvULmeK", "Jupiter Lend"],
  ["jup9FB8aPL62L8SHwhZJnxnV263qQvc9tseGT6AFLn6", "Jupiter Lend"],
  ["jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC", "Jupiter Lend (earn deposit)"],
  ["jupgfSgfuAXv4B6R2Uxu85Z1qdzgju79s6MfZekN6XS", "Jupiter Lend"],
  ["jupnw4B6Eqs7ft6rxpzYLJZYSnrpRgPcr589n5Kv4oc", "Jupiter Lend"],
  ["jupr81YtYssSyPt8jbnGuiWon5f6x9TcDEFxYe3Bdzi", "Jupiter Lend"],
  ["KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD", "Kamino klend"],
  ["FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr", "Kamino farms"],
  ["SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f", "Switchboard oracle"],
  ["st2Kvh82VyY8JskVJi4PebU9vdnR14VsaEy6TWVzD1r", "Kamino scope/oracle"],
  // Jupiter routes through this program but doesn't LABEL it in program-id-to-label,
  // so the auto-refresh never picks it up. Surfaced in QA 2026-07-17 (Kora rejected
  // "Program L2TE… is not in the allowed list" buying a stock / Jupiter Lend USDT).
  // Pin it here so every refresh keeps it. Executable BPF program (verified on-chain).
  ["L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95", "Jupiter route (unlabeled)"],
];

async function fetchJupiterPrograms() {
  const res = await fetch(JUPITER_PROGRAMS_URL);
  if (!res.ok) throw new Error(`Jupiter program list: ${res.status}`);
  const map = await res.json();
  // Jupiter returns programs in a non-stable order; sort by id so the file only changes
  // when the SET changes (a DEX added/removed), not on every refresh.
  return Object.entries(map)
    .filter(([id]) => BASE58.test(id))
    .sort((a, b) => a[0].localeCompare(b[0]));
}

function renderBlock(entries) {
  const seen = new Set();
  const lines = ["allowed_programs = ["];
  for (const [id, label] of entries) {
    if (seen.has(id)) continue;
    seen.add(id);
    lines.push(`    "${id}",  # ${label}`);
  }
  lines.push("]");
  return lines.join("\n");
}

const jupiter = await fetchJupiterPrograms();
const block = renderBlock([...BASE, ...PROTOCOLS, ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "Jupiter Aggregator v6"], ...jupiter]);

const toml = readFileSync(TOML_PATH, "utf8");
const next = toml.replace(/allowed_programs = \[[\s\S]*?\n\]/, block);
if (next === toml && !toml.includes(block)) {
  console.error("Could not find allowed_programs block to replace");
  process.exit(2);
}

const count = block.match(/"[1-9A-HJ-NP-Za-km-z]{32,44}"/g).length;
if (process.argv.includes("--check")) {
  if (next !== toml) {
    console.error(`allowlist is STALE — ${count} programs available, kora.toml differs. Run without --check.`);
    process.exit(1);
  }
  console.log(`allowlist up to date (${count} programs)`);
  process.exit(0);
}

writeFileSync(TOML_PATH, next);
console.log(`kora.toml allowed_programs refreshed: ${count} programs (${jupiter.length} from Jupiter). Redeploy: railway up --service kora`);
