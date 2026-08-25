// Every OXAR number in one place, read straight from production.
//
// Read-only. Prints what moved through us, what is still held, which markets it
// went through, and what the gasless relayer has left to spend.
//
// Run from web/:
//   node --env-file=.env.local scripts/metrics.mjs
//
// Needs in web/.env.local (both already exist for the app):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   NEXT_PUBLIC_SOLANA_RPC_URL   (the Helius URL — only for the relayer balance)
//
// Reads the views, never the raw tables: `oxar_aum`, `oxar_volume`,
// `oxar_volume_by_asset`, `oxar_aum_by_asset`. Filled nightly at 03:00 UTC by
// /api/volume-sync — so "last snapshot" below is how fresh these figures are. To
// refresh on demand, call that route with the CRON_SECRET bearer token.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (web/.env.local).");
  process.exit(1);
}

const RELAYER = "MQwRCwbeRmhpNdAjvkMysLHS92WSXQvw7wJ8hPoYFrL";
const STABLES = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: "USDT",
  "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH": "USDG",
};
// Jupiter Lend receipts are declared as bare constants, not catalog entries, so the
// catalog scan below cannot name them.
const EXTRA = {
  "9BEcn9aPEmhSPbPQeFGjidRiEKki46fVQDyPpSQXPA2D": "Jupiter Lend USDC",
  Cmn4v2wipYV41dkakDvCgFJpxhtaaKt11NyWV8pjSE8A: "Jupiter Lend USDT",
};

async function view(path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

/**
 * Mint → human name, scanned out of the yield catalog.
 *
 * Two shapes to cover, and getting them confused is how a report lies with a
 * straight face. The stock catalog is ONE ENTRY PER LINE, so there the name is on
 * the same line as the mint; a "nearest name above" search labelled five different
 * stocks "S&P 500". The other providers are multi-line objects where the name comes
 * a few lines before the mint.
 *
 * So: same line wins, and only if there is no name there does the most recent name
 * above count — and only within a few lines, so a mint can never inherit the name of
 * something declared far above it. A wrong label on a right number is worse than a
 * raw mint, which is what anything unmatched stays.
 */
const MINT_KEY = /(?:mint|heldMint|assetMint):\s*"([1-9A-HJ-NP-Za-km-z]{32,44})"/;
const NAME_KEY = /name:\s*"([^"]+)"/;
/** How far a mint may sit below the name it belongs to. */
const NAME_REACH = 12;

function catalogNames() {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "lib", "yield");
  const names = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
    const lines = readFileSync(join(dir, file), "utf8").split("\n");
    let lastName = null;
    let lastNameAt = -Infinity;
    lines.forEach((line, i) => {
      const name = line.match(NAME_KEY);
      if (name) {
        lastName = name[1];
        lastNameAt = i;
      }
      const mint = line.match(MINT_KEY);
      if (!mint) return;
      if (name) names[mint[1]] = name[1];
      else if (lastName && i - lastNameAt <= NAME_REACH) names[mint[1]] ??= lastName;
    });
  }
  return names;
}

const NAMES = catalogNames();
const label = (mint) => STABLES[mint] ?? EXTRA[mint] ?? NAMES[mint] ?? `${mint.slice(0, 8)}…`;
const usd = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function relayerSol() {
  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!rpc) return null;
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [RELAYER] }),
    });
    const body = await res.json();
    const lamports = body?.result?.value;
    return typeof lamports === "number" ? lamports / 1e9 : null;
  } catch {
    return null;
  }
}

const [aum, volume, byMarket, held, sol] = await Promise.all([
  view("oxar_aum"),
  view("oxar_volume"),
  view("oxar_volume_by_asset?order=volume_usd.desc&limit=15"),
  view("oxar_aum_by_asset?order=total_usd.desc&limit=20"),
  relayerSol(),
]);

const a = aum[0];
const v = volume[0];

console.log("\n══ OXAR ══\n");

if (a) {
  console.log("AUM");
  console.log(`  at work        ${usd(a.at_work_usd)}   (${a.wallets_at_work} wallets)  ← the headline`);
  console.log(`  idle cash      ${usd(a.idle_cash_usd)}   sitting in wallets, not deployed`);
  console.log(`  everything     ${usd(a.total_usd)}   (${a.wallets} wallets)`);
  console.log(`  last snapshot  ${a.taken_at.slice(0, 16).replace("T", " ")} UTC`);
} else {
  console.log("AUM — no snapshot yet. Run /api/volume-sync.");
}

if (v) {
  console.log("\nVOLUME THROUGH US (all time)");
  console.log(`  volume         ${usd(v.volume_usd)}   ${v.transactions} transactions, ${v.wallets} wallets`);
  console.log(`  in / out       ${usd(v.spent_usd)} in, ${usd(v.received_usd)} out`);
  console.log(`  period         ${v.first_at.slice(0, 10)} → ${v.last_at.slice(0, 10)}`);
}

if (byMarket.length) {
  console.log("\nVOLUME BY MARKET");
  for (const r of byMarket) {
    console.log(
      `  ${label(r.mint).padEnd(20)} ${usd(r.volume_usd).padStart(10)}  ${String(r.transactions).padStart(3)} tx  ${r.wallets} wallets`,
    );
  }
}

const positions = held.filter((r) => !STABLES[r.mint] && Number(r.total_usd) >= 0.5);
if (positions.length) {
  console.log("\nHELD RIGHT NOW");
  for (const r of positions) {
    console.log(`  ${label(r.mint).padEnd(20)} ${usd(r.total_usd).padStart(10)}  ${r.wallets} wallets`);
  }
}

console.log("\nGASLESS RELAYER");
console.log(
  sol === null
    ? "  balance        unknown (set NEXT_PUBLIC_SOLANA_RPC_URL to read it)"
    : `  balance        ${sol.toFixed(4)} SOL`,
);
console.log("  cost driver    account rent on a user's FIRST trade of an asset, not gas");
console.log("                 (~$1.5 per user; fees themselves are cents)\n");
