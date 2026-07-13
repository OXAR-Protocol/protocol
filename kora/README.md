# Kora fee-relayer — gasless USDC for OXAR

The node that lets a **SOL-less USDC wallet** deposit / swap / withdraw: Kora co-signs the
transaction as the **fee payer**, pays the SOL gas, and charges the user a few cents **in
USDC** (10% margin over cost). **OXAR subsidises $0** — the fee payer's SOL float is
reimbursed by the collected USDC. Design + rationale: `docs/plans/2026-07-13-kora-gasless-usdc.md`.

This folder is a self-contained Railway service:

| file | purpose |
|------|---------|
| `kora.toml` | what Kora will pay for — program allowlist, USDC as the fee token, anti-drainage policy |
| `signers.toml` | one in-memory fee-payer signer, key from `$KORA_SIGNER_KEY` |
| `Dockerfile` | thin wrapper over the prebuilt `ghcr.io/solana-foundation/kora` image |
| `entrypoint.sh` | injects the optional API key + starts `kora rpc start` |
| `railway.toml` | Railway build/deploy (Dockerfile builder, `/metrics` healthcheck) |
| `.env.example` | the three env vars you set on Railway |

---

## Deploy (one-time)

### 1. Create the fee-payer keypair

```bash
solana-keygen new --no-bip39-passphrase -o fee-payer.json   # keep this file safe, DO NOT commit
solana-keygen pubkey fee-payer.json                          # → the address to fund (step 2)

# Kora wants the secret as base58. Convert with the bs58 already in web/ :
cd ../web && node -e "const b=require('bs58').default||require('bs58');console.log(b.encode(Uint8Array.from(require('$PWD/../kora/fee-payer.json'))))"
# → copy this base58 string; it becomes KORA_SIGNER_KEY
```

### 2. Fund the fee-payer with a small SOL float

Send ~**0.1 SOL** (a few $) to the pubkey from step 1. This revolves — users' USDC tops it
back up. Seed small; watch the balance (see Monitoring).

### 3. Deploy on Railway

1. **New Project → Deploy from GitHub repo** → pick this repo, branch `feat/kora-gasless`.
2. Service **Settings → Root Directory = `kora`** (so this Dockerfile is used).
3. **Variables** (from `.env.example`):
   - `SOLANA_RPC_URL` — the app's Helius mainnet URL.
   - `KORA_SIGNER_KEY` — the base58 secret from step 1.
   - `KORA_API_KEY` — a long random string (recommended).
4. **Settings → Networking → Generate Domain.** That HTTPS URL is the node's address.

### 4. Verify it's up

```bash
curl -s https://<your-railway-domain>/metrics | grep -i fee_payer   # balance gauge → node is live

# JSON-RPC sanity (returns the fee payer pubkey + config):
curl -s https://<your-railway-domain>/ -X POST -H 'content-type: application/json' \
  -H 'x-api-key: <KORA_API_KEY>' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getConfig","params":[]}'
```

### 5. Hand off to the web app (P2)

Give me the domain + api key. They become web env vars (`KORA_RPC_URL`, `KORA_API_KEY`,
server-side) and P2 wires the client path in `solana-provider.signAndSend`.

---

## Swap routing (read before enabling the buy path)

The **deposit** path (USDC → Jupiter Lend) touches only the allowlisted programs — it works
as-is and fixes the core "you need SOL" bug. **Swaps/buys** route through Jupiter v6 **plus
whatever AMMs Jupiter picks** (Raydium, Orca, Meteora…). Kora rejects any tx containing a
program not in `allowed_programs`, so before routing buys through Kora, either:

- restrict Jupiter routing to a fixed DEX set (`dexes=` on the quote) and allowlist those, or
- add each AMM program id to `allowed_programs`.

We'll settle this during P3 with real swap txs — start with the deposit path.

## Upgrading

Image is pinned to a commit tag (`ghcr.io/solana-foundation/kora:f111b45`). To bump: check
newer tags at github.com/solana-foundation/kora/pkgs/container/kora, update the `FROM` in
`Dockerfile`, redeploy, re-run the verify step.

## Monitoring

- **Fee-payer SOL balance** — `/metrics` exposes it; alert when low and top up.
- **Anti-drainage** — `kora.toml` denies the fee payer every "spend from self" action except
  paying rent for the user's ATAs. Even an open node can't be drained: every tx must include
  the user's USDC payment. `KORA_API_KEY` adds a second gate + rate limiting.

## Non-goals

External (connected) wallets pay their own gas as today. Ukraine card on-ramp is a separate
track.
