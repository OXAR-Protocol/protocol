# Universal gasless via Kora — user pays gas in USDC ($0 to OXAR)

**Status:** planned · 2026-07-13 · branch `feat/kora-gasless`
**Owner:** @eternaki · daniel.l@oxar.app

## Why (the dilemma this resolves)

We want users to hold **USDC** (dollar-stable, no volatility) but Solana txs need **SOL**
for gas. Our audience is **non-crypto** — a "you need SOL" error is fatal. Every $0
alternative was eliminated:
- **Native SOL** — universal + $0, but a USDC-only wallet (0 SOL) hard-fails ("debit an
  account but found no record of a prior credit"). This is the bug users hit.
- **Jupiter Ultra gasless** — $0, no infra, BUT Jupiter-swaps only → breaks for non-swap
  deposits (Jupiter Lend) and **any future non-Jupiter asset (RWA, bonds, Kamino)**.
- **Privy App-pays sponsorship** — breaks on Jupiter v0 swap txs (baked fee-payer) + we pay.

**Kora is the only option that is universal (any program) + USDC-first + $0 to OXAR.**

## What Kora does

Kora (Solana Foundation fee relayer, `@solana/kora` v0.2.1, self-hosted JSON-RPC node) is
a **program-agnostic fee-payer**: it co-signs ANY transaction as the fee payer; the user
reimburses the fee **in USDC** (a few cents, deducted from their balance). Validators are
paid in SOL by Kora's fee-payer wallet, which is topped back up from the collected USDC —
so **OXAR subsidises nothing**. Which programs Kora will pay for is controlled by an
allowlist we own (System, Token, Token-2022, ATA, Jupiter, Jupiter Lend, Kamino, + each
future RWA/bond program = one config line).

## Transaction flow (per money action)

1. Build our instructions as today (deposit / swap / withdraw / send — any program).
2. Set the transaction **fee-payer = Kora's payer** (`getPayerSigner`).
3. Get the **USDC payment instruction** (`getPaymentInstruction({ transaction, fee_token:
   USDC, source_wallet: user })`) and append it.
4. User **partial-signs** with Privy (their authority sig only).
5. Send to Kora: **`signAndSendTransaction`** — Kora adds its fee-payer sig + broadcasts.

The KoraClient methods take/return **base64 transactions + JSON** (format-agnostic), so we
serialize our web3.js `Transaction` to base64 and convert Kora's returned payment
instruction (kit `Instruction`) to a web3.js `TransactionInstruction`. NOTE: to avoid the
`@solana/kit` version tangle (CLAUDE.md), prefer calling Kora's **raw JSON-RPC via fetch**
over the SDK if the kit-instruction conversion gets messy — the endpoints are plain JSON.

## Cost — genuinely ~$0

- **Subsidy from OXAR: $0** — the user pays their own ~$0.16 gas in USDC.
- **Node hosting:** one small container (Railway/Fly/Render **free/cheap tier**).
- **Fee-payer SOL float:** revolving, **reimbursed** by users' USDC — net-zero. Seed with a
  small amount (the $25 or less); it then sustains itself.

## Alpha economics update (2026-07-13)

Node validation requires a **paid `JUPITER_API_KEY`** for `price_source = "Jupiter"`. Rather
than block on another signup, alpha ships with **`price.type = "free"` — OXAR sponsors gas**.
Solana gas is sub-cent; the 0.1 SOL float covers thousands of txs (ATA-creation rent ~0.002
SOL is the real cost driver). Trade-off: with free pricing the node **would be drainable if
open**, so the `KORA_API_KEY` gate is now load-bearing (not just nice-to-have) and the client
must call Kora **through a server proxy** that holds the key (never expose it in the browser).
Flip to user-pays-USDC later = `price.type="margin"` + `price_source="Jupiter"` + a free
Jupiter API key; then the client appends the USDC payment ix (original flow above).

## Phases

- **P0 — Plan** (this doc). ✅
- **P1 — Kora node LIVE.** ✅ Deployed on Railway (project `oxar-kora`, service `kora`) from
  `kora/` (Dockerfile over prebuilt `ghcr.io/solana-foundation/kora`). Node URL
  `https://kora-production-c0ff.up.railway.app`, `x-api-key` auth, fee-payer
  `MQwRCwbeRmhpNdAjvkMysLHS92WSXQvw7wJ8hPoYFrL` funded 0.1 SOL. `getConfig` /
  `getPayerSigner` / `/metrics` all green. Config: allowlist (System/Token/Token-2022/ATA/
  ALT/ComputeBudget + Jupiter Lend + Jupiter v6), USDC token, `price=free`, `price_source=Mock`.
- **P2 — Client integration (next):** server proxy `app/api/kora/route.ts` (holds
  `KORA_API_KEY`, forwards to `KORA_RPC_URL`) + client `lib/gas/kora.ts`; a "via Kora" path
  in `solana-provider.signAndSend` for **embedded wallets** — build tx → fee-payer = Kora
  payer → Privy **partial-sign** (`signTransaction`) → Kora `signAndSendTransaction`. No USDC
  payment ix while `price=free`. External wallets keep native gas. Web env:
  `KORA_RPC_URL`, `KORA_API_KEY` (server-side, Vercel `oxar-web` + `web/.env.local`).
- **P3 — Verify:** on the running node, small real-money smoke — deposit (Jupiter Lend),
  buy (stock swap), withdraw, send — all from a **SOL-less USDC wallet**. Confirm the fee
  is taken in USDC and no SOL is needed. Money-path checklist.
- **P4 — Ship + graceful fallback:** route embedded money actions through Kora. If the node
  is unreachable AND the wallet has SOL, fall back to native-SOL send so the app degrades
  gracefully (the money path must not hard-depend on one container). Monitor node uptime +
  fee-payer SOL balance (alert on low).

## Risks / open questions

- **Node is now in the money path** → needs uptime monitoring + the native-SOL fallback (P4).
- **`@solana/kit` version tangle** — build is currently clean with `@solana/kora` added
  (top-level kit 6.9.0, klend 2.3.0 intact); if the payment-ix conversion pulls a bad kit,
  switch to raw JSON-RPC (no SDK).
- **Embedded partial-sign + external broadcast** — Privy embedded wallet must `signTransaction`
  (not signAndSend) so Kora can co-sign; re-verify on 3.33.1.
- **Per-program allowlist** — each new RWA/bond program must be added to `kora.toml` (one line).
- **Minimum fee viability** — tiny buys where the USDC fee is a big % — set a sensible min.

## Non-goals

- External (connected) wallets — they pay their own gas as today.
- Ukraine card on-ramp (separate track — [[project_onramp_ukraine]]).
