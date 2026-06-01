# New-Asset Money-Path Checklist

A repeatable runbook for adding a yield source/asset (e.g. an RWA vault, a new
Jupiter/Kamino market, a new stablecoin) WITHOUT re-auditing the whole money path.

## Principle: additive = safe; shared changes = full re-verify

The money path is layered and **asset-agnostic** below the provider:

- **Router** — `lib/yield/deposit-path.ts` (`chooseDepositPath`), `lib/wallet/outbound-destinations.ts` (`outboundKind`).
- **Rails** — Jupiter swap (`lib/swap/jupiter-swap.ts`), Delora bridge (`lib/bridge/delora.ts` + `app/api/bridge-quote`), direct.
- **Signing** — `providers/solana-provider.tsx` (`PrivySolanaAdapter`: embedded vs external, legacy vs v0, `signAndSend`).
- **Provider** — `lib/yield/types.ts` (`YieldProvider`); registered in `lib/yield/registry.ts`.

These shared layers have unit tests (routing, fee guards, bigint amount math,
serialization helpers, address validation). **Adding an asset means adding a
`YieldProvider` — the rails do NOT change.** So:

- **You add a provider only → no re-audit of the rails.** Run the per-asset smoke
  matrix below (one pass) and you're done.
- **You modify a shared layer (signing/router/rails) → re-run the FULL matrix**
  (every existing asset × embedded/external × direct/swap/bridge). Avoid touching
  shared layers while adding an asset; keep new logic inside the provider.

## Step 1 — Implement the provider (the contract)

Implement `YieldProvider` and register it. Expose EITHER `build*Ixs` (assembled
into a legacy tx by `use-yield-actions`) OR `build*Tx` (a prebuilt tx, e.g.
Kamino server route). Keep ALL protocol-specific logic here. No UI changes.

Add unit tests for the provider's PURE bits: APY parse, `getPosition` shape
parse, decimals.

## Step 2 — Code-review checklist (the gotchas that bite)

- [ ] **Decimals + mint** correct, and flow through swap/bridge amount math
      (bigint, `toBaseUnits` string-parse — never float).
- [ ] **Tx version for external wallets.** If the protocol SDK returns a **v0**
      tx, external wallets (Phantom/Trust) mangle it → must offer a **legacy**
      build (as we did for Jupiter swaps). Embedded can use v0. See
      `reference-external-wallet-signing` memory.
- [ ] **Token-2022 vs classic SPL.** Some RWA tokens are Token-2022 — ATA
      derivation, transfer ix, and balance reads differ. Check the token program.
- [ ] **Cross-chain dest:** if the asset should be bridgeable, confirm Delora has
      a route to its mint (`/v1/quotes` test) and add it to `outbound-destinations`.
- [ ] **Receiver needs SOL** for the final on-chain deposit (no gas sponsorship
      yet) — the pre-flight guard already enforces this for bridge.
- [ ] **ATA creation** is idempotent and NOT double-created (SDK usually does it).
- [ ] Error messages use `UserFacingError` (so they aren't clobbered to generic).

## Step 3 — Live smoke matrix (one pass per new protocol)

Small amounts (~$1–3). Test the combinations that actually exercise new code:

| Path | Embedded wallet | External wallet (Phantom) |
|---|---|---|
| **Direct** (hold the asset, deposit) | ✓ | ✓ |
| **Swap** (SOL/other SPL → asset → deposit) | ✓ | ✓ (legacy tx!) |
| **Bridge** (EVM → asset on Solana → deposit) | ✓ | ✓ |
| **Withdraw** (position → asset) | ✓ | ✓ |

Verify each: the position shows in Pile, amounts are right, and the friendly
error (not "Something went wrong") on the failure paths. Confirm on-chain with
`web/scripts/verify-position.mjs <wallet>` if unsure.

## When something looks wrong

Use the proven debugging move: a repro script (`web/scripts/`) that builds the
real tx and round-trips/simulates it — it isolates "our code" from "the wallet/
RPC" fast (that's how we found the v0 and flaky-RPC bugs). Don't guess fixes in
the signing path.

## Out of scope of this checklist

New CHAINS (config in `evm/chains`, `bridge/delora`, Alchemy networks) and gas
sponsorship are separate efforts — see `project-wallet-standard` /
`project-crosschain-gas` memories.
