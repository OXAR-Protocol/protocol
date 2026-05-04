# OXAR — Architecture

## System Overview

```
┌───────────────────────────────────────────────────────────┐
│                        USER                                │
│                    (Privy auth)                             │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────┐
│                    FRONTEND                                │
│                   (Next.js)                                │
│                                                            │
│  ┌────────────┐  ┌──────────┐  ┌────────────────────┐     │
│  │ Vault      │  │ Deposit/ │  │ Portfolio          │     │
│  │ Selector   │  │ Withdraw │  │ Dashboard          │     │
│  └────────────┘  └──────────┘  └────────────────────┘     │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────┐
│                 SOLANA BLOCKCHAIN                           │
│                                                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │              OXAR PROGRAM (Anchor)                │     │
│  │                                                    │     │
│  │  initialize_vault()    deposit()    withdraw()     │     │
│  │  update_nav()          update_apy()                │     │
│  └──────────────────────────────────────────────────┘     │
│                                                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐      │
│  │ Vault PDA  │  │ USDC Pool  │  │ Vault Token    │      │
│  │ (state)    │  │ (TokenAcc) │  │ Mint (SPL)     │      │
│  └────────────┘  └────────────┘  └────────────────┘      │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ Pyth /       │  │ Bond Rate    │  │ Proof of      │   │
│  │ Switchboard  │  │ API          │  │ Reserves      │   │
│  │ (FX rates)   │  │ (govt data)  │  │ (attestation) │   │
│  └──────────────┘  └──────────────┘  └───────────────┘   │
└───────────────────────────────────────────────────────────┘
```

## Production Architecture (post-hackathon)

```
┌──────────┐     ┌──────────────┐     ┌────────────────────┐
│ Frontend  │────▶│ Solana       │────▶│ Off-chain Backend  │
│ (Next.js) │     │ Programs     │     │ (NAV calculator)   │
└──────────┘     └──────────────┘     └────────┬───────────┘
                                                │
                       ┌────────────────────────┼──────────┐
                       ▼                        ▼          ▼
                ┌─────────────┐    ┌────────────┐  ┌──────────┐
                │ Licensed    │    │ Chainlink  │  │ SPV      │
                │ Broker      │    │ PoR Oracle │  │ (Legal   │
                │ (ICU/Dragon)│    │            │  │ wrapper) │
                └──────┬──────┘    └────────────┘  └──────────┘
                       │
                       ▼
                ┌─────────────┐
                │ NBU         │
                │ Depository  │
                │ (real bonds)│
                └─────────────┘
```

## Vault Lifecycle

```
CREATE          ACTIVE              MATURING           CLOSED
  │                │                    │                  │
  ▼                ▼                    ▼                  ▼
Admin calls    Users deposit      Approaching          Bond matures,
initialize()   & withdraw.       maturity date.       all USDC returned
               NAV updates       No new deposits.     to remaining
               daily.            Withdrawals only.    holders.
```

## Token Flow (Deposit)

```
User USDC Wallet                    OXAR Vault
      │                                │
      │── transfer USDC ──────────────▶│ (usdc_pool)
      │                                │
      │◀── mint oxUA-UAH ─────────────│ (vault_token_mint)
      │                                │
      │  NAV = 1.000                   │
      │  shares = amount / NAV         │
```

## Token Flow (Withdraw)

```
User Wallet                         OXAR Vault
      │                                │
      │── burn oxUA-UAH ──────────────▶│ (vault_token_mint)
      │                                │
      │◀── transfer USDC ────────────│ (usdc_pool)
      │                                │
      │  NAV = 1.042 (after yield)     │
      │  usdc = shares × NAV           │
```

## Accounts Structure (Solana)

```
Vault PDA
  seeds: ["vault", country, currency]
  │
  ├── authority: Pubkey (admin)
  ├── usdc_mint: Pubkey
  ├── vault_token_mint: Pubkey (mint authority = vault PDA)
  ├── usdc_pool: Pubkey (token authority = vault PDA)
  ├── country: String
  ├── currency: String
  ├── bond_type: String
  ├── apy_bps: u64
  ├── maturity_ts: i64
  ├── nav_per_share: u64
  ├── total_deposits: u64
  ├── total_shares: u64
  ├── last_update_ts: i64
  ├── is_active: bool
  └── bump: u8
```

## Frontend Pages

| Page | Description |
|------|-------------|
| `/` | Landing page with value proposition |
| `/vaults` | All available vaults with yields, risk scores |
| `/vault/[id]` | Individual vault: deposit, withdraw, stats |
| `/portfolio` | User's positions across all vaults |
| `/reserves` | Proof of Reserves dashboard |
