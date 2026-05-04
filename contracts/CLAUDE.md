# Contracts -- CLAUDE.md

Read the root `/OXAR/CLAUDE.md` first for project-wide context.

## Stack

- **Anchor** 0.30.1
- **Solana** 1.18.x (devnet)
- **Rust** edition 2021
- **Program ID**: `8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT`

## File Structure

```
programs/oxar-protocol/src/
  lib.rs              Program entrypoint, declares all instructions
  state.rs            Account structs (Vault, Listing)
  error.rs            OxarError enum
  constants.rs        Seeds, precision constants, protocol version
  instructions.rs     Module declarations for all instructions
  instructions/
    initialize_vault.rs
    deposit.rs
    crank_nav.rs
    claim.rs
    create_listing.rs
    cancel_listing.rs
    buy_listing.rs
    close_vault.rs
```

## Rules

### One instruction per file
Each file in `instructions/` contains:
1. A `handler(ctx, ...)` function with the business logic
2. A `#[derive(Accounts)]` context struct
3. Any instruction-specific parameter structs

The `lib.rs` entrypoint delegates to handlers -- it should contain NO business logic itself.

### Account Naming
- Rust: `snake_case` for field names (`vault_token_mint`, `usdc_pool`)
- IDL output: Anchor auto-converts to `camelCase` (`vaultTokenMint`, `usdcPool`)
- Never manually rename IDL fields -- let Anchor handle the conversion

### PDA Seeds
Every PDA derivation MUST include the series field. The vault PDA uses:
```rust
seeds = [
    VAULT_SEED,
    params.region.as_bytes(),
    params.denomination.as_bytes(),
    params.asset_subtype.as_bytes(),
    &params.series.to_le_bytes(),
],
```

When adding new PDA types, add the seed constant to `constants.rs` and mirror it in `sdk/src/pda.ts`.

### Error Handling
- All custom errors go in the `OxarError` enum in `error.rs`
- Every error variant MUST have a `#[msg("...")]` with a human-readable description
- Use `require!()` macro for precondition checks:
  ```rust
  require!(vault.is_active, OxarError::VaultNotActive);
  require!(amount > 0, OxarError::ZeroDeposit);
  ```
- NEVER use `.unwrap()` on arithmetic. Use checked math:
  ```rust
  let result = a.checked_mul(b).ok_or(OxarError::MathOverflow)?;
  let result = a.checked_div(b).ok_or(OxarError::MathOverflow)?;
  ```

### Security Checklist
For every instruction, verify:
- [ ] Authority/signer constraints are set (`has_one = authority` or `Signer` type)
- [ ] All PDAs use `bump = account.bump` for re-derivation
- [ ] Arithmetic uses `checked_*` methods -- no raw `+`, `-`, `*`, `/` on amounts
- [ ] Account close operations return lamports to correct recipient
- [ ] Token operations specify the correct `token_program`
- [ ] `init` accounts have correct `space` via `InitSpace` derive

### Constants
Defined in `constants.rs`:
```rust
VAULT_SEED, LISTING_SEED, ESCROW_SEED, POOL_SEED, MINT_SEED
INITIAL_NAV = 1_000_000        // 1.0 USDC with 6 decimals
BPS_DENOMINATOR = 10_000
PROTOCOL_VERSION = 1
USDC_DECIMALS = 6
NAV_PRECISION = 1_000_000      // u128 for intermediate math
```

These MUST stay in sync with `sdk/src/constants.ts`.

### Account Structs
Use `#[derive(InitSpace)]` on all account structs. For string fields, always annotate with `#[max_len(N)]`:
```rust
#[account]
#[derive(InitSpace)]
pub struct Vault {
    #[max_len(16)]
    pub asset_class: String,
    // ...
}
```

### Adding a New Instruction
1. Create `instructions/new_thing.rs` with handler + context struct
2. Add `pub mod new_thing;` to `instructions.rs`
3. Add entrypoint in `lib.rs` that delegates to handler
4. Add corresponding error variants to `error.rs` if needed
5. Add transaction builder to `sdk/src/transactions.ts`
6. Add hook `web/src/hooks/use-new-thing.ts`

## Build and Test

```bash
# Build program (from contracts/oxar-protocol/)
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run specific test file
yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/specific_test.ts
```

## Common Pitfalls
- Forgetting to copy updated IDL to `sdk/src/idl.json` after `anchor build`
- Using `u64` for intermediate NAV calculations -- use `u128` via `NAV_PRECISION` to avoid overflow
- Not bumping `PROTOCOL_VERSION` when changing account layout (will break deserialization)
- Missing `#[max_len]` on String fields causes `InitSpace` to compute wrong size
