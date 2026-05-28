# OXAR Yield Adapter Standard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor OXAR yield routing from hard-coded `YieldSource` enum into a modular adapter standard. Main program becomes a dispatcher; each yield source lives as a separate Anchor program (adapter) implementing a shared interface. Whitelisted via on-chain registry. Future RWA / partner sources plug in without main contract upgrades.

**Architecture:**
- **Dispatcher** (existing `oxar-protocol` program, modified) — holds Vault state, looks up adapter program from registry, executes CPI to standard adapter instructions.
- **Adapter Registry** — on-chain account holding whitelisted adapter program IDs + metadata; governance-gated (multisig initially).
- **Adapters** — separate Anchor programs (`kamino-adapter`, `marginfi-adapter`, `jlp-adapter`, `maple-adapter`, `drift-adapter`) each exposing `adapter_deposit`, `adapter_withdraw`, `adapter_current_value` instructions with stable account layout.

**Tech Stack:** Anchor 0.31.1, Solana 2.2.20, Rust edition 2021, TypeScript 5, Mocha/Chai for tests, mainnet-fork via `solana-test-validator --clone`.

**Reading order before starting:**
1. `contracts/CLAUDE.md` — coding rules, security checklist
2. `contracts/programs/oxar-protocol/src/state.rs` — current Vault/YieldSource structures
3. `contracts/programs/oxar-protocol/src/instructions/route_yield_deposit.rs` — current scaffold (handlers return `NotImplemented`)
4. This plan top-to-bottom

**Out of scope:**
- Off-chain Delora monitor (already exists in `services/delora-monitor`, separate work)
- Web UI changes (post-merge follow-up)
- Mainnet deploy & audit (after merge, separate)

---

## Phase 1: Interface Spec & Registry Foundation

Goal of phase: write down the contract between dispatcher and adapter, build the Adapter Registry, refactor existing `route_yield_deposit` / `route_yield_withdraw` / `crank_nav` to dispatch via the registry instead of matching enum. After Phase 1 the existing `Idle` adapter still works (as default), and a stub adapter (no-op) can be registered and called end-to-end.

### Task 1: Draft adapter interface specification

**Files:**
- Create: `docs/contracts/adapter-standard-v1.md`

**Step 1: Write the spec document**

Content of the file:

```markdown
# OXAR Yield Adapter Standard v1

## Purpose

Define a stable interface between OXAR dispatcher and yield adapter programs. Any Anchor program that implements this interface can be whitelisted in the OXAR Adapter Registry and routed to from user vaults.

## Required Instructions

Every adapter program MUST expose these three instructions with exact account layouts.

### `adapter_deposit`

Pulls `amount` of `vault.usdc_mint` from `vault.usdc_pool`, deposits into the adapter's underlying yield source, returns shares count via event.

Account layout (positional):
1. `[]` dispatcher_program — OXAR program ID; adapter MUST verify this is the caller via instruction sysvar
2. `[writable, signer]` vault — Vault PDA (signs CPI)
3. `[writable]` vault_usdc_pool — source USDC token account
4. `[writable]` adapter_state — adapter-owned PDA storing adapter-specific accounting
5. `[]...` remaining_accounts — pass-through to underlying protocol CPI (Kamino reserve, MarginFi bank, etc.)

Args:
- `amount: u64` — USDC amount in lamports
- `adapter_data: Vec<u8>` — opaque adapter-specific config (optional)

Returns via event:
```
emit!(AdapterDepositEvent {
  vault: Pubkey,
  amount_in: u64,
  shares_minted: u64,
  adapter_state_after: Pubkey,
});
```

### `adapter_withdraw`

Redeems `shares` from adapter, sends USDC back to `vault.usdc_pool`. Symmetric to deposit.

Account layout: same as deposit.

Args:
- `shares: u64`
- `adapter_data: Vec<u8>`

Returns via event:
```
emit!(AdapterWithdrawEvent {
  vault: Pubkey,
  shares_burned: u64,
  amount_out: u64,
});
```

### `adapter_current_value`

Read-only. Returns USD value (in USDC lamports) of adapter's current holdings attributed to vault.

Account layout:
1. `[]` dispatcher_program
2. `[]` vault
3. `[]` adapter_state
4. `[]...` remaining_accounts (oracle accounts, reserve state, etc.)

Args:
- `adapter_data: Vec<u8>`

Returns via event:
```
emit!(AdapterValueEvent {
  vault: Pubkey,
  current_value_usdc: u64,
  as_of_slot: u64,
});
```

## Security Requirements

Every adapter MUST:
- Verify caller is dispatcher via `solana_program::sysvar::instructions::load_instruction_at_checked` — first instruction must be from `OXAR_DISPATCHER_PROGRAM_ID`
- Use `checked_add`/`checked_mul`/`checked_div` on all arithmetic
- Never accept `amount == 0` or `shares == 0`
- Validate `remaining_accounts` matches expected layout for the underlying protocol
- Sign CPI to underlying protocol with vault PDA seeds passed by dispatcher

## Adapter State Account

Adapter owns a PDA per vault:
```
seeds = [b"adapter-state", adapter_program_id.as_ref(), vault.key().as_ref()]
```

Layout is adapter-defined but MUST start with:
```rust
pub struct AdapterStateHeader {
  pub vault: Pubkey,
  pub adapter_program: Pubkey,
  pub created_at: i64,
  pub total_shares: u64,
}
```

Followed by adapter-specific bytes.

## Versioning

Each adapter declares `ADAPTER_INTERFACE_VERSION: u8 = 1` at program top. Registry stores this; dispatcher refuses to dispatch to adapters whose version doesn't match dispatcher's expected version.
```

**Step 2: Commit**

```bash
git add docs/contracts/adapter-standard-v1.md
git commit -m "docs(contracts): draft yield adapter standard v1 spec"
```

---

### Task 2: Add `AdapterRegistry` state account

**Files:**
- Modify: `contracts/programs/oxar-protocol/src/state.rs`
- Modify: `contracts/programs/oxar-protocol/src/constants.rs`

**Step 1: Write failing test first**

Create: `contracts/tests/adapter-registry.ts`

```typescript
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("AdapterRegistry account", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.OxarProtocol;

  it("initializes empty registry", async () => {
    const [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId,
    );
    await program.methods
      .initializeAdapterRegistry()
      .accounts({ admin: provider.wallet.publicKey, registry: registryPda })
      .rpc();
    const acc = await (program.account as any).adapterRegistry.fetch(registryPda);
    expect(acc.admin.toBase58()).to.equal(provider.wallet.publicKey.toBase58());
    expect(acc.adapterCount).to.equal(0);
  });
});
```

**Step 2: Run test, expect failure** — `AdapterRegistry` does not yet exist.

```bash
cd contracts && anchor test --skip-local-validator 2>&1 | head -20
```

Expected: build error `cannot find type AdapterRegistry`.

**Step 3: Add `REGISTRY_SEED` to constants**

In `constants.rs`, add:

```rust
pub const REGISTRY_SEED: &[u8] = b"registry";
pub const ADAPTER_ENTRY_SEED: &[u8] = b"adapter-entry";
pub const MAX_ADAPTERS: u32 = 64;
pub const ADAPTER_INTERFACE_VERSION: u8 = 1;
```

**Step 4: Add `AdapterRegistry` and `AdapterEntry` structs to `state.rs`**

Append at end of file:

```rust
// ============================================================================
// Adapter Registry — whitelist of yield adapter programs (Phase 5+ refactor)
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct AdapterRegistry {
    pub admin: Pubkey,         // governance authority (multisig later)
    pub adapter_count: u32,    // monotonically increasing, never decreasing
    pub bump: u8,
}

/// One entry per whitelisted adapter program. PDA seeded by adapter program id.
#[account]
#[derive(InitSpace)]
pub struct AdapterEntry {
    pub adapter_program: Pubkey,
    pub interface_version: u8,
    #[max_len(32)]
    pub name: String,           // human-readable, e.g. "Kamino USDC"
    pub is_active: bool,        // can be paused without removing
    pub added_at: i64,
    pub bump: u8,
}
```

**Step 5: Add `initialize_adapter_registry` instruction**

Create: `contracts/programs/oxar-protocol/src/instructions/initialize_adapter_registry.rs`

```rust
use anchor_lang::prelude::*;
use crate::constants::*;
use crate::state::AdapterRegistry;

#[derive(Accounts)]
pub struct InitializeAdapterRegistry<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + AdapterRegistry::INIT_SPACE,
        seeds = [REGISTRY_SEED],
        bump,
    )]
    pub registry: Account<'info, AdapterRegistry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeAdapterRegistry>) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    registry.admin = ctx.accounts.admin.key();
    registry.adapter_count = 0;
    registry.bump = ctx.bumps.registry;
    msg!("Adapter registry initialized by {}", registry.admin);
    Ok(())
}
```

Register in `instructions.rs`:
```rust
pub mod initialize_adapter_registry;
pub use initialize_adapter_registry::*;
```

In `lib.rs` add entrypoint:
```rust
pub fn initialize_adapter_registry(ctx: Context<InitializeAdapterRegistry>) -> Result<()> {
    instructions::initialize_adapter_registry::handler(ctx)
}
```

**Step 6: Run test, expect pass**

```bash
cd contracts && anchor build && anchor test
```

Expected: `AdapterRegistry account · initializes empty registry · passing`.

**Step 7: Commit**

```bash
git add contracts/programs/oxar-protocol/src/{state.rs,constants.rs,instructions.rs,lib.rs} \
        contracts/programs/oxar-protocol/src/instructions/initialize_adapter_registry.rs \
        contracts/tests/adapter-registry.ts
git commit -m "feat(contracts): add AdapterRegistry state + init instruction"
```

---

### Task 3: Add `whitelist_adapter` and `pause_adapter` instructions

**Files:**
- Create: `contracts/programs/oxar-protocol/src/instructions/whitelist_adapter.rs`
- Create: `contracts/programs/oxar-protocol/src/instructions/pause_adapter.rs`
- Modify: `contracts/tests/adapter-registry.ts`

**Step 1: Append failing test**

In `adapter-registry.ts`:

```typescript
it("admin can whitelist adapter", async () => {
  const dummyAdapter = anchor.web3.Keypair.generate().publicKey;
  const [registryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("registry")], program.programId);
  const [entryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("adapter-entry"), dummyAdapter.toBuffer()], program.programId);
  await program.methods
    .whitelistAdapter("Dummy", 1)
    .accounts({
      admin: provider.wallet.publicKey,
      registry: registryPda,
      adapterEntry: entryPda,
      adapterProgram: dummyAdapter,
    })
    .rpc();
  const entry = await (program.account as any).adapterEntry.fetch(entryPda);
  expect(entry.adapterProgram.toBase58()).to.equal(dummyAdapter.toBase58());
  expect(entry.isActive).to.equal(true);
  expect(entry.interfaceVersion).to.equal(1);
});
```

**Step 2: Run test, expect failure** — `whitelistAdapter` not defined.

**Step 3: Implement `whitelist_adapter`**

`instructions/whitelist_adapter.rs`:

```rust
use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::OxarError;
use crate::state::{AdapterEntry, AdapterRegistry};

#[derive(Accounts)]
#[instruction(name: String, interface_version: u8)]
pub struct WhitelistAdapter<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [REGISTRY_SEED],
        bump = registry.bump,
        constraint = registry.admin == admin.key() @ OxarError::Unauthorized,
    )]
    pub registry: Account<'info, AdapterRegistry>,

    #[account(
        init,
        payer = admin,
        space = 8 + AdapterEntry::INIT_SPACE,
        seeds = [ADAPTER_ENTRY_SEED, adapter_program.key().as_ref()],
        bump,
    )]
    pub adapter_entry: Account<'info, AdapterEntry>,

    /// CHECK: adapter program; we only store its pubkey, no deserialization
    pub adapter_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<WhitelistAdapter>,
    name: String,
    interface_version: u8,
) -> Result<()> {
    require!(name.len() <= 32, OxarError::InvalidVaultState);
    require!(
        interface_version == ADAPTER_INTERFACE_VERSION,
        OxarError::InvalidVaultState
    );
    let clock = Clock::get()?;
    let entry = &mut ctx.accounts.adapter_entry;
    entry.adapter_program = ctx.accounts.adapter_program.key();
    entry.interface_version = interface_version;
    entry.name = name;
    entry.is_active = true;
    entry.added_at = clock.unix_timestamp;
    entry.bump = ctx.bumps.adapter_entry;

    let registry = &mut ctx.accounts.registry;
    registry.adapter_count = registry
        .adapter_count
        .checked_add(1)
        .ok_or(OxarError::MathOverflow)?;
    msg!("Adapter whitelisted: {} ({})", entry.name, entry.adapter_program);
    Ok(())
}
```

**Step 4: Implement `pause_adapter` (toggles `is_active`)**

`instructions/pause_adapter.rs`:

```rust
use anchor_lang::prelude::*;
use crate::constants::*;
use crate::error::OxarError;
use crate::state::{AdapterEntry, AdapterRegistry};

#[derive(Accounts)]
pub struct PauseAdapter<'info> {
    pub admin: Signer<'info>,

    #[account(
        seeds = [REGISTRY_SEED],
        bump = registry.bump,
        constraint = registry.admin == admin.key() @ OxarError::Unauthorized,
    )]
    pub registry: Account<'info, AdapterRegistry>,

    #[account(
        mut,
        seeds = [ADAPTER_ENTRY_SEED, adapter_entry.adapter_program.as_ref()],
        bump = adapter_entry.bump,
    )]
    pub adapter_entry: Account<'info, AdapterEntry>,
}

pub fn handler(ctx: Context<PauseAdapter>, paused: bool) -> Result<()> {
    let entry = &mut ctx.accounts.adapter_entry;
    entry.is_active = !paused;
    msg!("Adapter {} active={}", entry.adapter_program, entry.is_active);
    Ok(())
}
```

Register both in `instructions.rs` and `lib.rs` (same pattern as Task 2).

**Step 5: Run tests** — `anchor test`. Expected pass.

**Step 6: Commit**

```bash
git add contracts/programs/oxar-protocol/src/instructions/{whitelist_adapter,pause_adapter}.rs \
        contracts/programs/oxar-protocol/src/{instructions.rs,lib.rs} \
        contracts/tests/adapter-registry.ts
git commit -m "feat(contracts): admin whitelist/pause adapter instructions"
```

---

### Task 4: Refactor `Vault` to reference adapter program instead of `YieldSource` enum

**Files:**
- Modify: `contracts/programs/oxar-protocol/src/state.rs`
- Modify: `contracts/programs/oxar-protocol/src/instructions/initialize_personal_vault.rs`
- Modify: `contracts/tests/oxar-protocol.ts`

**Step 1: Update test for new field expectations**

In `oxar-protocol.ts`, find the existing initialize test and update assertions: expect `vault.adapterProgram` field (default `Pubkey::default()` for Idle).

**Step 2: Replace `yield_source` field with `adapter_program`**

In `state.rs`:

```rust
pub struct Vault {
    pub protocol_version: u8,
    pub vault_type: VaultType,
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub vault_token_mint: Pubkey,
    pub usdc_pool: Pubkey,
    pub adapter_program: Pubkey,    // NEW: zero pubkey == Idle (no external routing)
    pub risk_template: RiskTemplate,
    // ... rest unchanged
}
```

Delete the entire `pub enum YieldSource { ... }` block and all its variants.

**Step 3: Update `initialize_personal_vault` params**

```rust
pub struct InitializePersonalVaultParams {
    pub vault_id: u64,
    pub risk_template: RiskTemplate,
    pub adapter_program: Pubkey,    // Pubkey::default() for Idle
    pub fee_bps: u16,
}
```

In handler, set `vault.adapter_program = params.adapter_program;`.

**Step 4: Update `oxar-protocol.ts` test fixture** to pass `adapterProgram: PublicKey.default` instead of `yieldSource: { idle: {} }`.

**Step 5: Update mirror code in SDK & web**

- `sdk/src/types.ts` — regenerate after `anchor build` (`cp ../contracts/target/types/oxar_protocol.ts sdk/src/types.ts`)
- `web/src/hooks/use-vault-actions.ts` — replace `yieldSourceVariant(yieldSourceId)` returns with adapter program pubkey lookup
- `web/src/lib/constants.ts` — add `ADAPTER_PROGRAMS: Record<string, PublicKey>` placeholder map (filled in Phase 2+)

**Step 6: Run tests** — `anchor test` (existing personal vault flow must still pass).

**Step 7: Commit**

```bash
git add contracts/programs/oxar-protocol/src/{state.rs,instructions/initialize_personal_vault.rs} \
        contracts/tests/oxar-protocol.ts \
        sdk/src/types.ts \
        web/src/hooks/use-vault-actions.ts \
        web/src/lib/constants.ts
git commit -m "refactor(contracts): replace YieldSource enum with adapter_program pubkey on Vault"
```

---

### Task 5: Refactor `route_yield_deposit` to dispatch via CPI

**Files:**
- Modify: `contracts/programs/oxar-protocol/src/instructions/route_yield_deposit.rs`

**Step 1: Write failing test**

Create: `contracts/tests/fork/dispatcher-idle.ts`

```typescript
import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";

describe("dispatcher · Idle path (adapter_program = PublicKey.default)", () => {
  it("performs bookkeeping-only routing for Idle adapter", async () => {
    // ... create vault with adapter_program = PublicKey.default
    // deposit 100 USDC via deposit instruction (existing)
    // call route_yield_deposit(50)
    // assert vault.hot_pool_balance decreased by 50
    // assert vault.cold_capital increased by 50
  });
});
```

**Step 2: Run test** — expect failure (current code doesn't dispatch, returns NotImplemented for non-Idle, but new structure changes how Idle is identified).

**Step 3: Replace match-on-enum with adapter dispatch**

Replace the handler with:

```rust
pub fn handler(ctx: Context<RouteYieldDeposit>, amount: u64) -> Result<()> {
    require!(amount > 0, OxarError::ZeroDeposit);
    let vault = &mut ctx.accounts.vault;
    require!(amount <= vault.hot_pool_balance, OxarError::InsufficientFunds);

    // Idle path: bookkeeping only when no adapter is set
    if vault.adapter_program == Pubkey::default() {
        vault.hot_pool_balance = vault.hot_pool_balance
            .checked_sub(amount).ok_or(OxarError::MathOverflow)?;
        vault.cold_capital = vault.cold_capital
            .checked_add(amount).ok_or(OxarError::MathOverflow)?;
        msg!("Idle route: {} USDC bookkeeping hot->cold", amount);
        return Ok(());
    }

    // Adapter path: validate registry, CPI to adapter_deposit
    let registry = &ctx.accounts.registry;
    let entry = &ctx.accounts.adapter_entry;
    require!(entry.adapter_program == vault.adapter_program, OxarError::Unauthorized);
    require!(entry.is_active, OxarError::VaultNotActive);
    require!(entry.interface_version == ADAPTER_INTERFACE_VERSION, OxarError::InvalidVaultState);

    // Build CPI to adapter program. Adapter discriminator for `adapter_deposit`
    // is computed from Anchor's standard scheme: sha256("global:adapter_deposit")[..8]
    // Engineer references docs/contracts/adapter-standard-v1.md for layout.
    invoke_adapter_deposit(ctx, amount)?;

    vault.hot_pool_balance = vault.hot_pool_balance
        .checked_sub(amount).ok_or(OxarError::MathOverflow)?;
    vault.cold_capital = vault.cold_capital
        .checked_add(amount).ok_or(OxarError::MathOverflow)?;
    Ok(())
}
```

Update accounts struct to include:
- `registry: Account<'info, AdapterRegistry>` (PDA, optional only-if-not-Idle? Actually always required to keep interface uniform; for Idle, dispatch skips reads)
- `adapter_entry: Account<'info, AdapterEntry>` (PDA seeded by `vault.adapter_program`)
- `adapter_program: AccountInfo<'info>` for CPI target
- `remaining_accounts` — forwarded to adapter

The `invoke_adapter_deposit` helper function lives in a new `cpi_adapter.rs` module — engineer writes it using `anchor_lang::solana_program::program::invoke_signed` with the adapter discriminator + serialized args.

**Step 4: Run test** — expect pass.

**Step 5: Commit**

```bash
git add contracts/programs/oxar-protocol/src/instructions/route_yield_deposit.rs \
        contracts/programs/oxar-protocol/src/cpi_adapter.rs \
        contracts/tests/fork/dispatcher-idle.ts
git commit -m "feat(contracts): route_yield_deposit dispatches to adapter via CPI"
```

---

### Task 6: Mirror refactor for `route_yield_withdraw`

Same pattern as Task 5. Modify accounts, replace `match` with adapter dispatch, keep Idle path inline as bookkeeping-only. Symmetric test in `dispatcher-idle.ts`.

Commit message: `feat(contracts): route_yield_withdraw dispatches to adapter`

---

### Task 7: Mirror refactor for `crank_nav`

`crank_nav` calls `adapter_current_value` (read-only) to compute new NAV. For Idle path, NAV remains unchanged.

Symmetric test. Commit message: `feat(contracts): crank_nav reads value from adapter`

---

### Task 8: SDK + web sync after dispatcher refactor

**Files:**
- Modify: `sdk/src/idl.json` (regenerate)
- Modify: `sdk/src/types.ts` (regenerate)
- Modify: `web/sdk-local/dist/*`
- Modify: `web/src/hooks/{use-personal-vault,use-vault-actions}.ts`

Standard SDK sync flow per `contracts/CLAUDE.md`. Run `yarn build` in sdk/, then copy dist to web/sdk-local. Verify `yarn build` in web/ passes.

Commit: `chore(sdk,web): sync after dispatcher refactor`

---

### Task 9: Deploy refactored dispatcher to devnet

```bash
cd contracts && anchor build
anchor upgrade target/deploy/oxar_protocol.so \
  --program-id 8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ \
  --provider.cluster devnet
```

Verify with `solana program show <ID> --url devnet`. Initialize adapter registry on devnet via a one-off script (`contracts/scripts/init-registry.ts`).

Commit: `chore: deploy dispatcher refactor to devnet (slot <X>)`

---

## Phase 2: Reference Adapter — Kamino USDC (foundation)

After Phase 1, dispatcher is fully refactored but no real adapter exists yet. Phase 2 builds the first reference adapter as a separate Anchor program. Establishes the pattern; Phases 3-6 replicate for other protocols.

### Task 10: Scaffold `kamino-adapter` Anchor program

**Files:**
- Create: `contracts/programs/kamino-adapter/Cargo.toml`
- Create: `contracts/programs/kamino-adapter/Xargo.toml`
- Create: `contracts/programs/kamino-adapter/src/lib.rs`
- Modify: `contracts/Anchor.toml` (add `kamino_adapter = "..."` under `[programs.localnet]` / `[programs.devnet]`)
- Modify: `contracts/Cargo.toml` (add workspace member)

**Step 1: Generate program scaffold**

```bash
cd contracts && anchor new kamino-adapter
```

This creates skeleton. Replace `lib.rs` body with:

```rust
use anchor_lang::prelude::*;

declare_id!("KamA111111111111111111111111111111111111111"); // placeholder, replace after first build

pub const ADAPTER_INTERFACE_VERSION: u8 = 1;

#[program]
pub mod kamino_adapter {
    use super::*;

    pub fn adapter_deposit(ctx: Context<AdapterDeposit>, amount: u64, adapter_data: Vec<u8>) -> Result<()> {
        instructions::adapter_deposit::handler(ctx, amount, adapter_data)
    }
    pub fn adapter_withdraw(ctx: Context<AdapterWithdraw>, shares: u64, adapter_data: Vec<u8>) -> Result<()> {
        instructions::adapter_withdraw::handler(ctx, shares, adapter_data)
    }
    pub fn adapter_current_value(ctx: Context<AdapterCurrentValue>, adapter_data: Vec<u8>) -> Result<()> {
        instructions::adapter_current_value::handler(ctx, adapter_data)
    }
    pub fn initialize_adapter_state(ctx: Context<InitializeAdapterState>) -> Result<()> {
        instructions::initialize_adapter_state::handler(ctx)
    }
}

pub mod instructions;
pub mod state;
pub mod error;
```

**Step 2: Add stubs in `instructions/` returning `Err(OxarAdapterError::NotImplemented)`**.

**Step 3: Build**

```bash
anchor build
```

Replace `declare_id!` placeholder with output. Rebuild.

**Step 4: Commit**

```bash
git add contracts/programs/kamino-adapter/* contracts/Anchor.toml contracts/Cargo.toml
git commit -m "feat(kamino-adapter): scaffold program with empty instruction stubs"
```

---

### Task 11: Implement `initialize_adapter_state` for Kamino adapter

`initialize_adapter_state` creates the `AdapterState` PDA when a user first creates a vault pointing to this adapter. Called by dispatcher on `initialize_personal_vault` if `params.adapter_program != Pubkey::default()`.

(Spec the layout, account constraints, write test, implement, run, commit. ~30-60 min of focused work.)

---

### Task 12: Implement `adapter_deposit` for Kamino

This is the heart. Engineer:

1. Reads Kamino-Lend IDL from `klend-sdk` (npm package, or directly from Kamino docs)
2. Identifies their `deposit_reserve_liquidity_and_obligation_collateral` instruction (or equivalent)
3. Builds CPI from inside `adapter_deposit`:
   - Take USDC from `vault_usdc_pool` (signed by vault PDA seeds passed in remaining_accounts)
   - CPI to Kamino with full account layout (reserve, lending market, user obligation, etc. — all from `remaining_accounts`)
   - Kamino mints `kUSDC` to a token account owned by `adapter_state` PDA
4. Updates `adapter_state.total_shares += received_kusdc`
5. Emits `AdapterDepositEvent`

**Reading list before this task:**
- https://docs.kamino.finance/kamino-lend (deposit flow)
- `klend-sdk` source for instruction builder reference

**Test:** mainnet-fork test that clones Kamino main USDC reserve, deposits 100 USDC, asserts kUSDC received and adapter_state updated.

`contracts/tests/fork/kamino-deposit.ts`. Anchor.toml `[[test.validator.clone]]` entries added for Kamino program ID + main USDC reserve + lending market.

**Commit:** `feat(kamino-adapter): implement adapter_deposit via klend CPI`

---

### Task 13: Implement `adapter_withdraw` for Kamino

Symmetric. Redeems kUSDC for USDC, transfers back to `vault_usdc_pool`. Mainnet-fork test.

**Commit:** `feat(kamino-adapter): implement adapter_withdraw`

---

### Task 14: Implement `adapter_current_value` for Kamino

Read-only. Reads Kamino reserve `liquidity.cumulative_borrow_rate_wads` + reserve liquidity supply to compute current exchange rate. Multiplies by `adapter_state.total_shares` to derive USDC value.

Mainnet-fork test: deposit 100, time-warp the validator (`solana-test-validator --warp-slot N`), call `adapter_current_value`, assert value > 100 (yield accrued).

**Commit:** `feat(kamino-adapter): implement adapter_current_value with rate compounding`

---

### Task 15: End-to-end mainnet-fork test for Kamino adapter

`contracts/tests/fork/kamino-e2e.ts`:

1. Initialize adapter registry
2. Whitelist kamino-adapter program ID
3. Create personal vault with `adapter_program = kamino-adapter`
4. Initialize adapter state
5. Deposit 1000 USDC into vault → calls `deposit` (existing)
6. `route_yield_deposit(800)` → dispatcher CPIs to `adapter_deposit` → Kamino receives 800 USDC, vault holds 800 in cold + 200 hot
7. Warp slot, `crank_nav` → adapter_current_value returns ~800.5 USDC (yield)
8. `route_yield_withdraw(400)` → adapter redeems 400 USDC worth of kUSDC, vault hot grows
9. `withdraw(shares)` (existing instruction) → user gets USDC back proportional to NAV

**Commit:** `test(kamino-adapter): mainnet-fork end-to-end deposit/withdraw/yield`

---

### Task 16: Deploy Kamino adapter to devnet, whitelist in registry

```bash
anchor deploy --provider.cluster devnet --program-name kamino-adapter
ts-node contracts/scripts/whitelist-adapter.ts --adapter <PID> --name "Kamino USDC"
```

**Commit:** `chore(kamino-adapter): devnet deploy + registry whitelist (slot <X>)`

---

## Phase 3: MarginFi Adapter

Same pattern as Phase 2, 7 tasks (scaffold, init state, deposit CPI, withdraw CPI, current_value, e2e fork test, deploy+whitelist). MarginFi CPI is well-documented in their `marginfi-sdk`. Reading list: https://docs.marginfi.com.

Tasks 17-23.

---

## Phase 4: Jupiter LP Adapter

Same pattern. Jupiter Perps `add_liquidity` / `remove_liquidity` instructions. JLP price tracked via their Perps program's `pool` account. Reading list: https://station.jup.ag/perps-api.

Tasks 24-30.

---

## Phase 5: Maple Syrup USDC Adapter

Has whitelist gate — Maple permissioned. For mainnet-fork tests, clone whitelist account + add our adapter as whitelisted (mock setup). Reading list: https://docs.maple.finance/protocol/solana.

Tasks 31-37.

---

## Phase 6: Drift Insurance Fund Adapter

Drift's `add_insurance_fund_stake` / `remove_insurance_fund_stake` instructions. Includes unstake cool-down period — adapter handles via `adapter_state.unstake_request_at` field. Reading list: https://docs.drift.trade/insurance-fund.

Tasks 38-44.

---

## Phase 7: Documentation & Developer Onboarding

### Task 45: Write developer guide

**Files:**
- Create: `docs/contracts/how-to-write-an-adapter.md`

Walks a third-party developer through writing their own adapter:
1. Read `adapter-standard-v1.md`
2. `anchor new your-adapter`
3. Implement 4 instructions (init state + 3 standard)
4. Reference: copy structure from `kamino-adapter` as starting template
5. Write tests with mainnet-fork
6. Submit to OXAR team for whitelist review

**Commit:** `docs(contracts): how-to-write-an-adapter guide`

---

### Task 46: Update root README + contracts/CLAUDE.md

Add section "Yield Adapter Standard" pointing to spec + guide. List active adapters.

**Commit:** `docs: link adapter standard from main docs`

---

### Task 47: Open PR to main, request OXAR team review

Final acceptance gate. CI must pass:
- `anchor build` all programs (oxar-protocol + 5 adapters)
- `anchor test` (unit) green
- `yarn test-fork` (mainnet-fork suite) green
- `cargo clippy -- -D warnings` clean

Reviewers verify standard spec matches implementation; each adapter validates dispatcher properly.

**Commit:** `chore: open PR for adapter standard v1`

---

## Acceptance Criteria (final)

- [ ] `docs/contracts/adapter-standard-v1.md` published
- [ ] `oxar-protocol` (dispatcher) deployed to devnet with refactored route_yield_*
- [ ] `AdapterRegistry` initialized, governance-gated
- [ ] 5 reference adapters deployed to devnet and whitelisted: kamino-adapter, marginfi-adapter, jlp-adapter, maple-adapter, drift-adapter
- [ ] Mainnet-fork test suite green for all 5 adapters
- [ ] `cargo clippy -- -D warnings` clean
- [ ] `docs/contracts/how-to-write-an-adapter.md` published
- [ ] PR merged to `main`

## Out of Scope (deferred)

- DeloraCrossChain adapter — uses dispatcher pattern but underlying flow is off-chain (Delora API + monitor service). Will be a separate adapter built after Phase 6, using the same standard. Add Task 48 placeholder once these phases land.
- Mainnet deploy of OXAR contract — requires ~4 SOL, separate go-no-go gate.
- Independent security audit — separate bounty, after merge.

---

## Notes for Executor

- Each task is 30 min — 4 hours of work depending on familiarity. Phases 1 & 2 are foundation; rush through them risks compounding bugs across 5 adapters. Take time.
- Mainnet-fork tests are mandatory for every adapter task — they're the only realistic verification short of mainnet deploy.
- All adapter programs share the standard interface but their internal CPI mechanics differ widely. Treat each adapter as its own mini-project.
- When confused: cross-reference `docs/contracts/adapter-standard-v1.md` first, then ask in repo Issues with `adapter-work` tag.
