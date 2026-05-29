# OXAR Web → Protocol-SDK Migration (v1)

**Date:** 2026-05-29
**Status:** approved design, implementing on `feat/web-sdk-migration`

## Decision

OXAR v1 is a **non-custodial UI over protocols' own SDKs** — no custom contracts.
Funds go directly into Kamino / Jupiter Lend; the user holds their own position.
OXAR builds transactions client-side; the wallet signs. Zero deploy, zero audit.

(Background + rationale: peer who shipped the same does exactly this; see memory
`project-sdk-frontend-pivot`. Contracts preserved unmerged on `feat/kamino-adapter`
/ PR #5 for a possible v2 — group vaults & automations need on-chain logic.)

## Scope (chosen)

- **In v1:** deposit/withdraw direct to **Kamino + Jupiter Lend**, yield marketplace
  (user picks the source manually), aggregate balance.
- **Cut to v2:** rules/automations (need contract or off-chain delegated bot),
  group vaults (need a contract for shared ownership).
- **Routing:** user selects the source (maps onto the existing `yield` marketplace).
- **Network:** mainnet only (these protocols aren't on devnet). Test with small real
  funds. Helius RPC already configured.

## Architecture

New provider abstraction so adding a protocol = one file, no UI change:

```
web/src/lib/yield/
  types.ts      YieldProvider: { id, name, deposit(), withdraw(), getPosition(), getApy() }
  jupiter.ts    @jup-ag/lend (ready-made Earn txs)
  kamino.ts     @kamino-finance/klend-sdk
  registry.ts   PROVIDERS list + lookup
  index.ts
```

- **deposit/withdraw** → `provider.*()` returns a `Transaction`; existing `send()`
  flow signs it (source becomes the SDK, not `program.methods`).
- **position** → `provider.getPosition(wallet)` reads principal + accrued yield.
- **apy** → from SDK / protocol API.
- **aggregate** ("you") → sum of positions across providers.

## Web changes

**Remove (contract-coupled):** `use-vault-actions`, `use-personal-vault`,
`use-group-vault*`, `use-group-members`, `use-rules`; `app/(app)/rules`; web imports
of the contract `@oxar/sdk` (pda/idl/anchor types).

**Rewrite:** `use-oxar-program` → `use-solana` (keep connection/wallet, drop the
Anchor program); `use-aggregate-balance` → sum provider positions; `yield` page →
rows call `provider.deposit()`; `pile` page → position screen (deposit/withdraw +
balance with yield).

**New:** `lib/yield/*`, `use-yield-actions`, `use-yield-positions`.

**Keep:** `use-usdc-balance`, landing `sections/*`, UI hooks, waitlist, Privy provider.

## Build order

1. Install SDKs in `web/`; explore real APIs.
2. `lib/yield` types + registry + Jupiter provider → `yarn build`.
3. Kamino provider → build.
4. New hooks; rewire `yield` + `pile`; aggregate balance.
5. Remove dead contract hooks/pages; final `yarn build`.

Runtime verification against mainnet (small real funds) is the user's step — the
SDKs only target live mainnet protocols.
