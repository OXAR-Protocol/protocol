# OXAR Smart Contract — Final Design

Last updated: April 2026

## Overview

Single Anchor program on Solana. Parametrized vaults supporting any asset class. Fully autonomous — no admin intervention after initialization.

## Accounts

### Vault PDA

```
seeds: ["vault", asset_class, region, denomination, asset_subtype]
```

```rust
Vault {
    protocol_version: u8,
    authority: Pubkey,
    usdc_mint: Pubkey,
    vault_token_mint: Pubkey,
    usdc_pool: Pubkey,

    asset_class: String,      // "GOVT_BOND", "COMMODITY", etc.
    region: String,           // "UA", "TR", "GLOBAL"
    denomination: String,     // "UAH", "USD", "EUR", "XAU"
    asset_subtype: String,    // "SHORT", "MID", "WAR", "STANDARD"

    apy_bps: u64,             // 1800 = 18.00%
    nav_per_share: u64,       // 6 decimals, start = 1_000_000
    total_deposits: u64,
    total_shares: u64,

    last_update_ts: i64,
    maturity_ts: i64,         // 0 = perpetual
    is_active: bool,
    fee_bps: u16,             // marketplace fee (30 = 0.3%)
    bump: u8,
}
```

### Listing PDA

```
seeds: ["listing", vault, seller]
```

```rust
Listing {
    seller: Pubkey,
    vault: Pubkey,
    token_mint: Pubkey,
    amount: u64,
    price_per_token: u64,     // USDC per token, 6 decimals
    created_at: i64,
    bump: u8,
}
```

## Instructions (7)

### Admin (one-time setup)

| Instruction | Description |
|---|---|
| `initialize_vault` | Create vault with parameters, mint SPL token, create USDC pool |

### Autonomous (anyone can call)

| Instruction | Description |
|---|---|
| `crank_nav` | Recalculate NAV: `new_nav = old_nav × (1 + apy/365)^days_passed` |

### User

| Instruction | Description |
|---|---|
| `deposit` | Send USDC → receive vault tokens at current NAV |
| `claim` | After maturity: burn tokens → receive USDC |
| `create_listing` | List tokens for sale at chosen price |
| `cancel_listing` | Cancel listing, tokens returned |
| `buy_listing` | Buy listed tokens, 0.3% fee to protocol |

## NAV Calculation (autonomous)

```
days_passed = (now - last_update_ts) / 86400
new_nav = old_nav × (1 + apy_bps / 10_000 / 365) ^ days_passed
```

No admin needed. Anyone calls `crank_nav`, contract calculates.

## Claim (after maturity)

```
Requires: now >= maturity_ts
usdc_amount = user_tokens × nav_per_share / 10^6
Burns tokens, transfers USDC to user.
```

## Marketplace Flow

```
Seller: create_listing(500 tokens, $1.05 each)
  → tokens transferred to escrow PDA

Buyer: buy_listing()
  → pays 500 × $1.05 = $525 USDC
  → protocol fee (0.3%): $1.575 → treasury
  → seller receives: $523.425
  → tokens: escrow → buyer

Cancel: cancel_listing()
  → tokens: escrow → seller
```

## MVP Vaults (Ukraine, 6)

| Vault | asset_class | region | denom | subtype | APY |
|---|---|---|---|---|---|
| oxUA-UAH-SHORT | GOVT_BOND | UA | UAH | SHORT | ~15-18% |
| oxUA-UAH-MID | GOVT_BOND | UA | UAH | MID | ~14-17% |
| oxUA-USD | GOVT_BOND | UA | USD | STANDARD | ~3.8-4% |
| oxUA-EUR | GOVT_BOND | UA | EUR | STANDARD | ~3.1-3.5% |
| oxUA-WAR-UAH | GOVT_BOND | UA | UAH | WAR | ~15-18% |
| oxUA-WAR-USD | GOVT_BOND | UA | USD | WAR | ~3.8-4% |

## Testing

For testing, set `maturity_ts = now + 300` (5 minutes) to verify full lifecycle without waiting.

## Fees

| Action | Who pays | Cost |
|---|---|---|
| Contract deploy | Us (once) | ~1-4 SOL (mainnet) |
| initialize_vault ×6 | Us (once) | ~0.1 SOL |
| deposit | User | ~0.000005 SOL |
| create_listing | User (refundable) | ~0.003 SOL |
| buy_listing | User | ~0.000005 SOL + 0.3% fee |
| crank_nav | Anyone | ~0.000005 SOL |
| claim | User | ~0.000005 SOL |
