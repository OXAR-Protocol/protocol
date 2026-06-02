// Generates patched mainnet account fixtures for the no-warp native fork test.
//
// klend's refresh does `clock.slot - reserve.last_update.slot`, which underflows
// on a non-warped fork (validator starts near slot 0 while the cloned reserve
// carries a ~423M mainnet slot). Warping to the mainnet slot blows past macOS's
// kern.maxfilesperproc during accounts-hash. So instead we clone the reserve and
// the Scope price account and rewrite their cached slots to a low value — the
// validator reaches it within a few slots and klend's math stays sane.
//
//   MAINNET_RPC_URL=... node scripts/gen-fork-fixtures.js
//
// Writes tests/fork/fixtures/{reserve,scope}-patched.json (solana --account format).
const { Connection, PublicKey } = require("@solana/web3.js");
const fs = require("fs");

const RESERVE = new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59");
const SCOPE = new PublicKey("3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH");
const RPC = process.env.MAINNET_RPC_URL ?? "https://api.mainnet-beta.solana.com";

const LOW_SLOT = 1n;
const SCOPE_HEADER = 40; // 8 disc + 32 oracle_mappings
const SCOPE_ENTRY = 56; // DatedPrice: price(16) + last_updated_slot(8) + unix_ts(8) + generic(24)
const SCOPE_ENTRIES = 512;
const SLOT_OFF_IN_ENTRY = 16; // after the 16-byte Price

function toFixture(pubkey, info) {
  return {
    pubkey: pubkey.toBase58(),
    account: {
      lamports: info.lamports,
      data: [info.data.toString("base64"), "base64"],
      owner: info.owner.toBase58(),
      executable: info.executable,
      rentEpoch: 0,
    },
  };
}

(async () => {
  const c = new Connection(RPC, "confirmed");
  const [reserve, scope] = await c.getMultipleAccountsInfo([RESERVE, SCOPE]);

  // Reserve: last_update.slot at byte 16.
  reserve.data.writeBigUInt64LE(LOW_SLOT, 16);

  // Scope: rewrite last_updated_slot of every price entry.
  for (let i = 0; i < SCOPE_ENTRIES; i++) {
    const off = SCOPE_HEADER + i * SCOPE_ENTRY + SLOT_OFF_IN_ENTRY;
    if (off + 8 <= scope.data.length) scope.data.writeBigUInt64LE(LOW_SLOT, off);
  }

  const dir = `${__dirname}/../tests/fork/fixtures`;
  fs.writeFileSync(`${dir}/reserve-patched.json`, JSON.stringify(toFixture(RESERVE, reserve), null, 2));
  fs.writeFileSync(`${dir}/scope-patched.json`, JSON.stringify(toFixture(SCOPE, scope), null, 2));
  console.log("wrote reserve-patched.json + scope-patched.json (slots -> 1)");
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
