# Solana Yield Adapter Standard — Bounty Design (Superteam Ukraine)

Standalone, clean-room reference implementation of a Solana Yield Adapter Standard.
Built isolated from the OXAR product (no Vault/NAV/bond coupling) so the standard
reads as minimal, clean, and extensible — the bounty's top judging axes.

- **Reward:** 1st 700 / 2nd 300 USDC. **Judging:** Correctness 40%, Interface 25%,
  Dev Guide 20%, Code Quality/Tests 15%.
- **Toolchain (pinned to bounty):** Anchor 0.31.1, Solana 2.2.20, Rust edition 2021,
  TypeScript 5, Mocha/Chai, mainnet-fork via `solana-test-validator --clone`.
- **Submission:** public GitHub repo, 5 adapters passing mainnet-fork tests, registry
  on devnet, spec markdown, "build your own adapter" guide.

## Where it lives

A self-contained workspace at `yield-adapter-standard/` on branch
`feat/yield-adapter-standard-bounty`. It does **not** touch `web/`, `sdk/`,
`contracts/oxar-protocol`, or any product code. For submission it is extracted to its
own fresh public repo (history clean). Reuses proven code from `feat/kamino-adapter`
(Kamino klend CPI, fork harness, USDC funding fixture) and the registry pattern from
`feat/yield-adapter-standard`, decoupled from the OXAR Vault.

## Architecture

```
dispatcher (program)          router + governance-gated registry
  ├─ Registry / AdapterEntry  whitelist of approved adapter programs
  ├─ Position PDA             per (owner, adapter) accounting (decoupled from OXAR Vault)
  └─ deposit / withdraw / current_value   → CPI into the routed adapter
adapters (5 independent programs, each its own program ID)
  kamino-usdc · marginfi-usdc · jupiter-lp · maple-syrup · drift-insurance-fund
```

The dispatcher is a thin router: validate the adapter is whitelisted + active in the
registry, then CPI the adapter's standard instruction, reading the result via return
data. Adapters never trust the caller blindly — each verifies the dispatcher is the
caller via the instructions sysvar.

## Interface (v1)

Every adapter program MUST expose exactly four instructions:

- `adapter_initialize` — create the adapter-owned `AdapterState` PDA + any token
  accounts (idempotent).
- `adapter_deposit(amount: u64, data: Vec<u8>)` — pull `amount` USDC, deposit into the
  source, **return `shares: u64`** via `set_return_data` + emit `AdapterDeposit`.
- `adapter_withdraw(shares: u64, data: Vec<u8>)` — redeem `shares`, return USDC to the
  caller's pool, **return `amount_out: u64`** + emit `AdapterWithdraw`.
- `adapter_current_value(data: Vec<u8>)` — read-only, **return `value_usdc: u64`** +
  emit `AdapterValue`.

**Return mechanism (decided: both).** Canonical result via
`anchor_lang::solana_program::program::{set_return_data,get_return_data}` (Borsh
`u64`) so the dispatcher composes synchronously; plus an `emit!` event for indexers.

**AdapterState PDA** — owned by the adapter, `seeds = [b"adapter-state", position]`.
Fixed header then adapter-specific bytes:

```rust
pub struct AdapterStateHeader {
    pub position: Pubkey,        // dispatcher Position this state backs
    pub adapter_program: Pubkey,
    pub dispatcher: Pubkey,      // expected caller — verified on every ix
    pub created_at: i64,
    pub total_shares: u64,
}
```

**Security invariants (every adapter):** verify caller == dispatcher via
`load_instruction_at_checked` on the instructions sysvar; `checked_*` arithmetic only;
reject `amount/shares == 0`; validate `remaining_accounts` against the expected
underlying layout; sign underlying CPI with `AdapterState` PDA seeds; declare
`ADAPTER_INTERFACE_VERSION: u8 = 1` (registry refuses version mismatch).

## Registry (governance-gated)

In the dispatcher program. `Registry { admin, adapter_count, bump }` +
`AdapterEntry { adapter_program, interface_version, name, is_active, added_at, bump }`
(PDA seeded by adapter program id). Instructions: `initialize_registry`,
`whitelist_adapter` (admin-only, checks the program is executable + version match),
`pause_adapter` (admin toggles `is_active`). `admin` is a single key now, swappable for
a multisig — note this in the spec.

## The five adapters

| Adapter | Underlying CPI | Notes / risk |
|---|---|---|
| **kamino-usdc** | klend `deposit_reserve_liquidity` ↔ `redeem_reserve_collateral` | Ported, proven. Value via reserve exchange rate. |
| **marginfi-usdc** | `lending_account_deposit` ↔ `lending_account_withdraw` | Well-documented. Value via bank share value. |
| **jupiter-lp** | Jupiter Perps `add_liquidity` ↔ `remove_liquidity` (JLP) | Value = JLP balance × pool AUM / JLP supply (oracle accounts cloned). |
| **maple-syrup** | Maple Solana lending pool deposit/withdraw | **Risk:** syrupUSDC is CCIP-bridged; native redeem may be queued/permissioned. If no permissionless deposit CPI exists, model as request-based withdraw and clone+seed the whitelist in fork. Verify the live Maple Solana program first. |
| **drift-insurance-fund** | `add_insurance_fund_stake` / `request_remove_insurance_fund_stake` / `remove_insurance_fund_stake` | **Risk:** unstake cooldown. `AdapterState` stores `unstake_request_ts`; fork test warps slots past cooldown. |

## Mainnet-fork test strategy

Per adapter, one e2e: `solana-test-validator` clones the protocol program(s) +
required accounts (reserves/banks/pools/oracles) at a pinned mainnet slot via
`[[test.validator.clone]]` in `Anchor.toml`; a fabricated USDC token-account JSON
(`fixtures/usdc-funded.json`, owner = test payer, large balance) funds the payer since
USDC's mint authority is Circle. Flow: init registry → whitelist adapter → init
position+adapter_state → deposit → warp slot → current_value (> deposit) → withdraw →
assert USDC returned. Pin the slot so clones are deterministic.

## Deliverables

- `yield-adapter-standard/docs/SPEC.md` — the standard (refined from v1).
- `yield-adapter-standard/docs/BUILD-YOUR-OWN-ADAPTER.md` — guide; target: working
  adapter in < 1 day, using kamino-usdc as the copy-paste template.
- `README.md` — overview, build/test commands, deployed devnet registry address.
- All 6 programs build; `cargo clippy -- -D warnings` clean; 5 fork e2e green.
- Registry deployed to devnet.

## Build order (verified increments)

1. Foundation: workspace + `adapter-interface` shared crate + dispatcher (router +
   registry + Position) + **kamino-usdc** ported → build + Kamino fork e2e green.
2. SPEC.md + BUILD-YOUR-OWN-ADAPTER.md (lock the interface before replicating).
3. marginfi-usdc → fork e2e. 4. jupiter-lp → fork e2e.
5. maple-syrup (resolve the deposit-path question first). 6. drift-insurance-fund.
7. Devnet deploy registry + whitelist all five; final README + clippy + PR.

## Out of scope

OXAR product integration, mainnet deploy, external audit. The standard is the product
here.
