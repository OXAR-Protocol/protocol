// One-off on-chain proof that a wallet's funds are actually in Jupiter Lend and
// accruing. Reads the lending position straight from mainnet with the same SDK
// the protocol uses — independent of the OXAR UI.
//
//   node scripts/verify-position.mjs <WALLET_ADDRESS>
//
// Prints, per stablecoin market: jlToken shares held (the on-chain receipt),
// current redeemable underlying (shares × live exchange rate), and the live APY.
import { readFileSync } from "node:fs";
import { Connection, PublicKey } from "@solana/web3.js";
import { getUserLendingPositionByAsset } from "@jup-ag/lend/earn";

const owner = process.argv[2];
if (!owner) {
  console.error("usage: node scripts/verify-position.mjs <WALLET_ADDRESS>");
  process.exit(1);
}

// Pull the mainnet RPC out of .env.local without a dotenv dep.
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const rpc = env.match(/NEXT_PUBLIC_SOLANA_RPC_URL="?([^"\n]+)"?/)?.[1];
if (!rpc) throw new Error("NEXT_PUBLIC_SOLANA_RPC_URL not found in .env.local");

const MARKETS = [
  { sym: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", dec: 6 },
  { sym: "USDT", mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", dec: 6 },
  { sym: "USDG", mint: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH", dec: 6 },
];

const connection = new Connection(rpc, "confirmed");
const user = new PublicKey(owner);

// Live APY (totalRate bps) from Jupiter's Lend token list.
const rates = await fetch("https://lite-api.jup.ag/lend/v1/earn/tokens")
  .then((r) => r.json())
  .then((ts) => Object.fromEntries(ts.map((t) => [t.assetAddress, Number(t.totalRate)])))
  .catch(() => ({}));

const ui = (bn, dec) => Number(bn.toString()) / 10 ** dec;

console.log(`\nWallet: ${owner}\nRPC: ${rpc.replace(/api-key=.*/, "api-key=***")}\n`);

for (const m of MARKETS) {
  try {
    const pos = await getUserLendingPositionByAsset({
      user,
      asset: new PublicKey(m.mint),
      connection,
    });
    const shares = ui(pos.lendingTokenShares, m.dec);
    const underlying = ui(pos.underlyingAssets, m.dec);
    if (shares === 0 && underlying === 0) {
      console.log(`${m.sym}: no position`);
      continue;
    }
    const rate = shares > 0 ? underlying / shares : 0;
    const apy = (rates[m.mint] ?? 0) / 100; // bps → %
    console.log(
      `${m.sym}: shares=${shares.toFixed(6)} jl${m.sym}  ` +
        `redeemable=${underlying.toFixed(6)} ${m.sym}  ` +
        `exchangeRate=${rate.toFixed(8)}  liveAPY=${apy.toFixed(2)}%`,
    );
  } catch (e) {
    console.log(`${m.sym}: read failed — ${e.message}`);
  }
}
console.log("");
