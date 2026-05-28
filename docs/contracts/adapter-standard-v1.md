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

    emit!(AdapterDepositEvent {
      vault: Pubkey,
      amount_in: u64,
      shares_minted: u64,
      adapter_state_after: Pubkey,
    });

### `adapter_withdraw`

Redeems `shares` from adapter, sends USDC back to `vault.usdc_pool`. Symmetric to deposit.

Account layout: same as deposit.

Args:
- `shares: u64`
- `adapter_data: Vec<u8>`

Returns via event:

    emit!(AdapterWithdrawEvent {
      vault: Pubkey,
      shares_burned: u64,
      amount_out: u64,
    });

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

    emit!(AdapterValueEvent {
      vault: Pubkey,
      current_value_usdc: u64,
      as_of_slot: u64,
    });

## Security Requirements

Every adapter MUST:
- Verify caller is dispatcher via `solana_program::sysvar::instructions::load_instruction_at_checked` — first instruction must be from `OXAR_DISPATCHER_PROGRAM_ID`
- Use `checked_add`/`checked_mul`/`checked_div` on all arithmetic
- Never accept `amount == 0` or `shares == 0`
- Validate `remaining_accounts` matches expected layout for the underlying protocol
- Sign CPI to underlying protocol with vault PDA seeds passed by dispatcher

## Adapter State Account

Adapter owns a PDA per vault:

    seeds = [b"adapter-state", adapter_program_id.as_ref(), vault.key().as_ref()]

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
