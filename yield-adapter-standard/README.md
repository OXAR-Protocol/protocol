# Solana Yield Adapter Standard

A reference implementation of a **standard interface for Solana yield sources**: a core
dispatcher, a governance-gated on-chain registry, reference adapters, mainnet-fork
tests, and a developer spec + guide.

Any yield source — a lending reserve, an LP, a staking pool, a tokenized RWA — can be
wrapped in an **adapter** (one small Anchor program) and whitelisted in the registry.
The **dispatcher** then routes `deposit` / `withdraw` / `current_value` to it over CPI.
Adding a source never requires upgrading the dispatcher.

```
user ──▶ dispatcher ──(registry check)──CPI──▶ adapter ──CPI──▶ protocol (Kamino, …)
              router + Position                4 standard ix       real yield
```

- **Standard:** [`docs/SPEC.md`](docs/SPEC.md)
- **Build your own adapter (<1 day):** [`docs/BUILD-YOUR-OWN-ADAPTER.md`](docs/BUILD-YOUR-OWN-ADAPTER.md)

## Layout

```
crates/adapter-interface   shared: header, discriminators, return-data codec,
                           caller verification, canonical errors (both sides import this)
programs/dispatcher        router + governance registry + Position model (7 instructions)
programs/kamino-usdc       reference adapter — Kamino Lend USDC reserve (klend CPI)
tests/fork                 mainnet-fork e2e (bankrun + native validator)
scripts                    fork-test runner + fixture generator
```

## Status

| Component | Build | Fork test |
|---|---|---|
| `adapter-interface` | ✅ (+ unit tests) | — |
| `dispatcher` (router + registry) | ✅ `anchor build` | ✅ via Kamino e2e |
| `kamino-usdc` | ✅ `anchor build` | ✅ deposit/withdraw/value round-trip |
| `marginfi-usdc` | ✅ `anchor build` | ✅ deposit/withdraw/value round-trip |
| jupiter-lp · maple-syrup · drift-insurance-fund | planned | planned |

## Toolchain

Anchor **0.31.1**, Solana **2.2.20**, Rust edition 2021. `Cargo.lock` is committed and
pins a few transitive deps (`blake3`, `proc-macro-crate`, `unicode-segmentation`) down to
versions that build on the Solana platform-tools rustc (1.84) — newer releases require
`edition2024`/rustc 1.85. A clean checkout builds as-is.

## Build & test

```bash
anchor build                                   # builds all programs → target/{deploy,idl}
cargo test -p adapter-interface                # unit tests (discriminators, etc.)
MAINNET_RPC_URL=<rpc> ./scripts/fork-test.sh   # Kamino mainnet-fork e2e (one command)
cargo clippy --all-targets -- -D warnings      # lints
```

The fork test spins up a local `solana-test-validator` that clones the real Kamino
USDC-reserve account set from mainnet, then runs the full dispatcher flow —
`initialize_registry → whitelist → open_position → deposit → current_value → withdraw` —
asserting USDC round-trips through real klend CPIs. `MAINNET_RPC_URL` defaults to public
mainnet-beta; a private RPC is faster.

## License

MIT — see [`LICENSE`](LICENSE).
