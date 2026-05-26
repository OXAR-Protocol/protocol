# Contracts -- CLAUDE.md

Read the root `/OXAR/CLAUDE.md` first for project-wide context.

## Stack

- **Anchor** 0.31.1
- **Solana** 2.2.20 (devnet) — platform-tools v1.48, rustc 1.84.1
- **Rust** edition 2021
- **Program ID**: `8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ`
- **Network**: devnet (cluster `Devnet`)

## File Structure

```
programs/oxar-protocol/src/
  lib.rs              Program entrypoint, declares all instructions
  state.rs            Account structs (Vault, GroupVault, GroupMember, Rule)
  error.rs            OxarError enum
  constants.rs        Seeds, precision constants, protocol version
  instructions.rs     Module declarations for all instructions
  instructions/
    # Personal vault
    initialize_personal_vault.rs
    setup_vault_pool.rs
    deposit.rs
    withdraw.rs
    crank_nav.rs
    # Group vault (Phase B)
    initialize_group_vault.rs
    join_group_vault.rs
    group_deposit.rs
    group_withdraw.rs
    leave_group_vault.rs
    # Rules engine (Phase C)
    create_rule.rs
    execute_rule.rs
    cancel_rule.rs
    # Yield routing (Phase D)
    route_yield_deposit.rs
    route_yield_withdraw.rs
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
| PDA          | Seeds                                                |
|--------------|------------------------------------------------------|
| Vault        | `"vault"` + authority + `vault_id.to_le_bytes()` (u64) |
| GroupVault   | `"group"` + creator + `vault_id.to_le_bytes()` (u64) |
| GroupMember  | `"member"` + group_vault + member                    |
| Rule         | `"rule"` + owner + `rule_id.to_le_bytes()` (u64)     |
| Vault Mint   | `"mint"` + vault                                     |
| USDC Pool    | `"pool"` + vault                                     |

When adding new PDA types, add the seed constant to `constants.rs` and mirror it in `sdk/src/pda.ts`.

### Vault Type Constraints
Every instruction that touches a `Vault` MUST check `vault_type`:
- Personal-only instructions (`deposit`, `withdraw`, `route_yield_*`) add:
  `constraint = vault.vault_type == VaultType::Personal @ OxarError::VaultTypeMismatch`
- Group-only instructions (`group_deposit`, `group_withdraw`) are reached only via
  the `group_vault` PDA, but should still defensively assert `VaultType::Group`.

### Error Handling
- All custom errors go in the `OxarError` enum in `error.rs`
- Every error variant MUST have a `#[msg("...")]` with a human-readable description
- Use `require!()` macro for precondition checks:
  ```rust
  require!(vault.is_active, OxarError::VaultNotActive);
  require!(amount > 0, OxarError::ZeroDeposit);
  require!(shares > 0, OxarError::BelowMinimumDeposit);
  ```
- NEVER use `.unwrap()` on arithmetic. Use checked math:
  ```rust
  let result = a.checked_mul(b).ok_or(OxarError::MathOverflow)?;
  let result = a.checked_div(b).ok_or(OxarError::MathOverflow)?;
  ```

### Security Checklist
For every instruction, verify:
- [ ] Authority/signer constraints are set (`has_one = authority` or `Signer` type)
- [ ] `vault_type` constraint matches the operation (Personal vs Group)
- [ ] All PDAs use `bump = account.bump` for re-derivation
- [ ] Arithmetic uses `checked_*` methods — no raw `+`, `-`, `*`, `/` on amounts
- [ ] Integer-division results that mint/burn tokens are checked `> 0`
  (avoid silent 0-share mints from dust deposits)
- [ ] Account close operations return lamports to correct recipient
- [ ] Token operations specify the correct `token_program`
- [ ] `init` accounts have correct `space` via `InitSpace` derive

### Constants
Defined in `constants.rs`:
```rust
VAULT_SEED, GROUP_SEED, MEMBER_SEED, RULE_SEED, POOL_SEED, MINT_SEED
INITIAL_NAV = 1_000_000        // 1.0 USDC with 6 decimals
BPS_DENOMINATOR = 10_000
PROTOCOL_VERSION = 2           // bump on layout changes
USDC_DECIMALS = 6
NAV_PRECISION = 1_000_000      // u128 for intermediate math
MAX_RULE_DESTINATIONS = 5
```

These MUST stay in sync with `sdk/src/constants.ts`.

### Account Structs
Use `#[derive(InitSpace)]` on all account structs. For string fields, always annotate with `#[max_len(N)]`:
```rust
#[account]
#[derive(InitSpace)]
pub struct GroupVault {
    #[max_len(48)]
    pub name: String,
    // ...
}
```

### Adding a New Instruction
1. Create `instructions/new_thing.rs` with handler + context struct
2. Add `pub mod new_thing;` to `instructions.rs` (and re-export)
3. Add entrypoint in `lib.rs` that delegates to handler
4. Add corresponding error variants to `error.rs` if needed
5. After `anchor build`: copy IDL + regenerate types in SDK
6. Add transaction builder to `sdk/src/transactions.ts`
7. Add hook `web/src/hooks/use-new-thing.ts`

## Build, Test, Deploy

```bash
# Build program (from contracts/)
anchor build

# Run tests (uses Localnet — Anchor.toml [provider] cluster = "Localnet")
anchor test

# Initial deploy to devnet
anchor deploy --provider.cluster devnet

# Upgrade existing deploy (preferred — preserves Program ID + cheaper)
anchor upgrade target/deploy/oxar_protocol.so \
  --program-id 8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ \
  --provider.cluster devnet

# Run specific test file
yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/specific_test.ts
```

After `anchor build`, sync IDL + types into SDK and web:
```bash
cp target/idl/oxar_protocol.json ../sdk/src/idl.json
cp target/types/oxar_protocol.ts ../sdk/src/types-anchor.ts
# If account/enum layout changed, also overwrite sdk/src/types.ts
cp ../sdk/src/types-anchor.ts ../sdk/src/types.ts
cd ../sdk && yarn build
cd .. && rm -rf web/sdk-local/dist web/node_modules/@oxar && \
  cp -r sdk/dist web/sdk-local/dist && \
  cp sdk/src/idl.json web/sdk-local/dist/idl.json && \
  cp sdk/src/idl.json web/src/lib/idl/oxar_protocol.json
```

## Common Pitfalls
- Forgetting to copy updated IDL **and** regenerate `sdk/src/types.ts` after `anchor build`
- Using `u64` for intermediate NAV calculations — use `u128` via `NAV_PRECISION` to avoid overflow
- Not bumping `PROTOCOL_VERSION` when changing account layout (will break deserialization on upgrades)
- Missing `#[max_len]` on String fields causes `InitSpace` to compute wrong size
- Forgetting `vault_type` constraint on instructions that should be Personal-only — group-vault PDAs share the same `Vault` discriminator and would otherwise pass `is_active` checks
- Trusting integer division: `shares = amount * NAV_PRECISION / nav_per_share` can be 0 for dust deposits → always `require!(shares > 0)`
- Setting `[provider] cluster = "Devnet"` in `Anchor.toml` breaks `anchor test` (it stops spawning a localnet). Use `Localnet` as default and pass `--provider.cluster devnet` for deploys.
