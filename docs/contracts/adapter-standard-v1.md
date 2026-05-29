# OXAR Yield Adapter Standard v1

## Purpose

Define a stable interface between OXAR dispatcher and yield adapter programs. Any Anchor program that implements this interface can be whitelisted in the OXAR Adapter Registry and routed to from user vaults.

## Required Instructions

Every adapter program MUST expose these four instructions with exact account layouts.

### `adapter_initialize`

Creates the `adapter_state` PDA the first time a vault routes to this adapter. MUST be called before `adapter_deposit`.

Account layout (positional):
1. `[]` instructions_sysvar — `sysvar1nstructions` account for caller verification
2. `[writable, signer]` vault — Vault PDA (signs CPI)
3. `[writable]` adapter_state — adapter-owned PDA (init), seeds = `[b"adapter_state", adapter_program_id, vault]`
4. `[writable, signer]` rent_payer — pays for account rent
5. `[]` system_program

Args:
- `adapter_data: Vec<u8>` — adapter-specific init config (MUST NOT exceed 256 bytes; pass empty vec if unused)

Body MUST initialize `AdapterStateHeader`:
- `vault` = `ctx.accounts.vault.key()`
- `adapter_program` = program ID
- `created_at` = `Clock::get()?.unix_timestamp`
- `total_shares` = 0

### `adapter_deposit`

Pulls `amount` USDC from `vault_usdc_pool` (the USDC token account owned by the vault PDA), deposits into the adapter's underlying yield source, returns shares count via event.

`adapter_state` MUST already exist (initialized via `adapter_initialize`); will fail with `AdapterStateUninit` (6006) if not.

Account layout (positional):
1. `[]` instructions_sysvar — `sysvar1nstructions` account for caller verification
2. `[writable, signer]` vault — Vault PDA (signs CPI)
3. `[writable]` vault_usdc_pool — source USDC token account
4. `[writable]` adapter_state — adapter-owned PDA storing adapter-specific accounting
5. `[]...` remaining_accounts — pass-through to underlying protocol CPI (Kamino reserve, MarginFi bank, etc.)

Args:
- `amount: u64` — USDC base units (6 decimals)
- `adapter_data: Vec<u8>` — opaque adapter-specific config (MUST NOT exceed 256 bytes; pass empty vec if unused)

Returns via event:

    emit!(AdapterDepositEvent {
      vault: Pubkey,
      amount_in: u64,
      shares_minted: u64,
      adapter_state_after: Pubkey,
    });

### `adapter_withdraw`

Redeems `shares` from adapter, sends USDC back to `vault_usdc_pool` (the USDC token account owned by the vault PDA). Adapter MUST treat `vault_usdc_pool` as the destination; `adapter_state` is the source of redemption logic against underlying protocol holdings.

Account layout (positional):
1. `[]` instructions_sysvar — `sysvar1nstructions` account for caller verification
2. `[writable, signer]` vault — Vault PDA (signs CPI)
3. `[writable]` vault_usdc_pool — destination USDC token account
4. `[writable]` adapter_state — adapter-owned PDA storing adapter-specific accounting
5. `[]...` remaining_accounts — pass-through to underlying protocol CPI

Args:
- `shares: u64`
- `adapter_data: Vec<u8>` — MUST NOT exceed 256 bytes; pass empty vec if unused

Returns via event:

    emit!(AdapterWithdrawEvent {
      vault: Pubkey,
      shares_burned: u64,
      amount_out: u64,
    });

### `adapter_current_value`

Returns USDC value of adapter's current holdings attributed to vault via event.

**Not purely read-only:** the instruction emits an event into the transaction log, which is the return mechanism. Off-chain callers (NAV monitor, frontend) SHOULD prefer **simulation** (`simulateTransaction`) to obtain the value without paying CU cost. On-chain callers may invoke it as part of a regular transaction and read the event from the program log.

Account layout (positional):
1. `[]` instructions_sysvar — `sysvar1nstructions` account for caller verification
2. `[]` vault
3. `[]` adapter_state
4. `[]...` remaining_accounts (oracle accounts, reserve state, etc.)

Args:
- `adapter_data: Vec<u8>` — MUST NOT exceed 256 bytes; pass empty vec if unused

Returns via event (for telemetry and off-chain monitors):

    emit!(AdapterValueEvent {
      vault: Pubkey,
      current_value_usdc: u64,
      as_of_slot: u64,
    });

`as_of_slot` MUST be the minimum of (`Clock::get()?.slot`, any oracle update slot used in computing the value). Dispatcher considers any value older than 60 slots stale.

**Return data (required for on-chain dispatcher consumption):** Adapter MUST call
`anchor_lang::solana_program::program::set_return_data(&current_value_usdc.to_le_bytes())`
before returning. The dispatcher reads this u64 value via `get_return_data()` after the
CPI to update `vault.nav_per_share`. If return data is absent the dispatcher returns
`NotImplemented`.

**Scope of returned value:** The adapter returns ONLY the value of its own holdings
(cold capital deployed to it). The dispatcher composes total vault value as
`hot_pool_balance + adapter_value` before recomputing `nav_per_share`. Adapters MUST
NOT include the vault's hot pool in their returned value.

## Security Requirements

Every adapter MUST:
- Verify caller is dispatcher via the instruction sysvar using the pattern below — do NOT rely on "first instruction" position, as ComputeBudget or other preamble instructions may precede the adapter call:

```rust
use anchor_lang::solana_program::sysvar::instructions::{
    load_current_index_checked, load_instruction_at_checked,
};

let ix_sysvar = ctx.accounts.instructions_sysvar.to_account_info();
let current_ix_index = load_current_index_checked(&ix_sysvar)?;
let parent_ix = load_instruction_at_checked(current_ix_index as usize, &ix_sysvar)?;
require_keys_eq!(parent_ix.program_id, OXAR_DISPATCHER_PROGRAM_ID, OxarError::Unauthorized);
```

- `instructions_sysvar: AccountInfo<'info>` MUST appear as the FIRST account in every adapter instruction's layout (positional slot 1). v1 has no separate `dispatcher_program` account — the caller's identity is verified solely via the instructions sysvar pattern above.
- Use `checked_add`/`checked_mul`/`checked_div` on all arithmetic
- Never accept `amount == 0` or `shares == 0`
- Validate `remaining_accounts` matches expected layout for the underlying protocol
- Sign CPI to underlying protocol with vault PDA seeds passed by dispatcher

## Canonical Error Codes

Adapters MUST return the following error codes for the matching failure modes (Anchor `#[error_code]` enum):

| Code | Name                | Condition                                                         |
|------|---------------------|-------------------------------------------------------------------|
| 6000 | Unauthorized        | Caller is not the dispatcher                                      |
| 6001 | ZeroAmount          | `amount == 0` or `shares == 0`                                    |
| 6002 | InsufficientShares  | Withdraw exceeds `adapter_state.total_shares`                     |
| 6003 | MathOverflow        | Checked arithmetic returned `None`                                |
| 6004 | VersionMismatch     | `adapter_data` version byte != `ADAPTER_INTERFACE_VERSION`        |
| 6005 | StaleOracle         | Oracle update older than 60 slots                                 |
| 6006 | AdapterStateUninit  | `adapter_state` not yet initialized via `adapter_initialize`      |

## Adapter State Account

Adapter owns a PDA per vault:

    seeds = [b"adapter_state", adapter_program_id.as_ref(), vault.key().as_ref()]

Layout is adapter-defined but MUST start with:

```rust
pub struct AdapterStateHeader {
  pub vault: Pubkey,
  pub adapter_program: Pubkey,
  pub created_at: i64,
  /// Number of adapter-internal shares this specific vault holds
  /// (not the underlying protocol's global supply).
  pub total_shares: u64,
}
```

The `adapter_state` account's data deserializes into `AdapterStateHeader` followed by adapter-specific bytes.

## Versioning

Each adapter declares `ADAPTER_INTERFACE_VERSION: u8 = 1` at program top. Registry stores this value. Dispatcher accepts an adapter iff `adapter_entry.interface_version == DISPATCHER_EXPECTED_VERSION`. Cross-version compatibility (e.g. v1 adapters with v2 dispatcher) is out of scope for v1; will be addressed in v2 spec.

`adapter_data` MUST NOT exceed 256 bytes. Pass an empty vec if unused. Adapters MAY define a structured layout for it (e.g. `borsh::deserialize` into a custom struct) — document the layout in the adapter's own README.
