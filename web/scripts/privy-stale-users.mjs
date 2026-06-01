// Read-only admin tool — lists Privy users and flags "double-wallet" accounts to
// deactivate per the v2 wallet standard (an empty embedded wallet next to an
// external Solana wallet gets mis-picked as the account).
//
// LOCAL ONLY — do NOT commit (needs the Privy app secret). Run from web/:
//   1) add to web/.env.local:   PRIVY_APP_SECRET=...   (App settings → Basics)
//   2) node --env-file=.env.local scripts/privy-stale-users.mjs
//
// It only READS. It never deletes — review the output, then delete each flagged
// user in the Privy Dashboard (Users → ⋯ → Delete).

const APP_ID = process.env.PRIVY_APP_ID;
const APP_SECRET = process.env.PRIVY_APP_SECRET;
if (!APP_ID || !APP_SECRET) {
  console.error("Missing PRIVY_APP_ID / PRIVY_APP_SECRET (put the secret in web/.env.local).");
  process.exit(1);
}

const headers = {
  Authorization: "Basic " + Buffer.from(`${APP_ID}:${APP_SECRET}`).toString("base64"),
  "privy-app-id": APP_ID,
};

async function* allUsers() {
  let cursor;
  do {
    const url = new URL("https://auth.privy.io/api/v1/users");
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Privy API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    for (const u of json.data ?? []) yield u;
    cursor = json.next_cursor;
  } while (cursor);
}

const short = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "—");
const clients = (xs) => xs.map((a) => `${a.wallet_client_type}:${short(a.address)}`).join(", ") || "—";

const rows = [];
for await (const u of allUsers()) {
  const accts = u.linked_accounts ?? [];
  const sol = accts.filter((a) => a.type === "wallet" && a.chain_type === "solana");
  const embeddedSol = sol.filter((a) => a.wallet_client_type === "privy");
  const externalSol = sol.filter((a) => a.wallet_client_type && a.wallet_client_type !== "privy");
  const externalEvm = accts.filter(
    (a) => a.type === "wallet" && a.chain_type === "ethereum" && a.wallet_client_type !== "privy",
  );
  const hasEmail = accts.some((a) => a.type === "email");

  // Categorize:
  //  DEACTIVATE — embedded + external Solana: the empty embedded gets mis-picked.
  //  REVIEW     — no email, no Solana wallet, only an EVM wallet: may be locked out
  //               of login now that wallet-login is Solana-only.
  //  OK         — email-only embedded, or a Solana-wallet account. Leave alone.
  let verdict = "OK";
  if (embeddedSol.length > 0 && externalSol.length > 0) verdict = "DEACTIVATE";
  else if (!hasEmail && externalSol.length === 0 && embeddedSol.length === 0 && externalEvm.length > 0)
    verdict = "REVIEW (EVM-only login)";

  rows.push({
    verdict,
    id: u.id,
    login: hasEmail ? "email" : externalSol.length ? "solana-wallet" : externalEvm.length ? "evm-wallet" : "?",
    embeddedSol: embeddedSol.map((a) => short(a.address)).join(", ") || "—",
    externalSol: clients(externalSol),
    externalEvm: clients(externalEvm),
  });
}

const order = { DEACTIVATE: 0, "REVIEW (EVM-only login)": 1, OK: 2 };
rows.sort((a, b) => order[a.verdict] - order[b.verdict]);

console.log(`\nScanned ${rows.length} users.\n`);
for (const r of rows) {
  console.log(
    `[${r.verdict}] ${r.id}\n    login=${r.login}  embeddedSOL=${r.embeddedSol}  extSOL=${r.externalSol}  extEVM=${r.externalEvm}`,
  );
}
const n = rows.filter((r) => r.verdict === "DEACTIVATE").length;
const r2 = rows.filter((r) => r.verdict.startsWith("REVIEW")).length;
console.log(`\nDEACTIVATE: ${n}   REVIEW: ${r2}   OK: ${rows.length - n - r2}`);
console.log("Empty any embedded wallet that holds funds first, then delete the user in the Privy Dashboard.\n");
