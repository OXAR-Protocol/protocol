#!/usr/bin/env node
/**
 * One-time backfill of historical money-flow into the `events` table.
 *
 * The activity for every wallet is already on-chain — this reconstructs the
 * deposit/buy history by reusing our own live endpoints (no secrets needed):
 *   for each wallet → POST /api/activity (Helius history → parsed events)
 *                   → POST /api/track for each deposit/buy (deduped by tx sig).
 *
 * Because /api/track dedups on the tx signature, this is safe to re-run and
 * won't double-count against going-forward tracking.
 *
 * USAGE:
 *   node scripts/backfill-events.mjs wallets.txt
 *   BASE_URL=https://app.oxar.app node scripts/backfill-events.mjs wallets.txt
 *
 * `wallets.txt` = one Solana wallet address per line (export from Privy dashboard →
 * Users / Wallets). Include BOTH embedded and connected wallets for the full number.
 */

import { readFileSync } from "node:fs";

const BASE_URL = process.env.BASE_URL || "https://app.oxar.app";
const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/backfill-events.mjs <wallets.txt>");
  process.exit(1);
}

const wallets = readFileSync(file, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let totalRows = 0;
let totalUsd = 0;

for (const wallet of wallets) {
  try {
    const res = await fetch(`${BASE_URL}/api/activity`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner: wallet }),
    });
    const { events = [] } = await res.json();
    const moneyIn = events.filter((e) => (e.kind === "deposit" || e.kind === "buy") && typeof e.usd === "number");

    for (const e of moneyIn) {
      await fetch(`${BASE_URL}/api/track`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet, kind: e.kind, usd: e.usd, sig: e.signature, chain: "solana" }),
      });
      totalRows += 1;
      totalUsd += e.usd;
    }
    console.log(`${wallet.slice(0, 6)}… → ${moneyIn.length} deposits/buys`);
    await sleep(300); // be gentle on the RPC
  } catch (err) {
    console.error(`${wallet.slice(0, 6)}… failed:`, err?.message ?? err);
  }
}

console.log(`\nDone. Backfilled ${totalRows} rows, ~$${totalUsd.toFixed(2)} volume.`);
console.log("Verify in Supabase: select round(sum(usd)::numeric,2), count(*) from events;");
