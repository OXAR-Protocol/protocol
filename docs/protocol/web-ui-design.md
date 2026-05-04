# OXAR Web UI — Design

Last updated: April 2026

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styles | Tailwind CSS |
| UI Components | shadcn/ui |
| Auth + Wallet | Privy (embedded Solana wallet) |
| Solana | @solana/web3.js + @coral-xyz/anchor |
| State | React hooks (useState/useContext) |

## Pages (5)

### 1. Login (`/login`)
- Logo + tagline
- "Get Started" button → Privy modal (email, Google, Apple, wallet)

### 2. Vaults (`/vaults`)
- 6 cards in grid
- Each: name, APY, NAV, total deposits, maturity countdown
- Badges: "WAR" for military, "FX Risk" for UAH
- Click → vault detail

### 3. Vault Detail (`/vault/[id]`)
- Info: APY, NAV, deposits, shares, maturity
- Deposit form: USDC amount + "Deposit" button
- Shows tokens received after deposit

### 4. Marketplace (`/marketplace`)
- Table of active listings: seller, vault, amount, price, "Buy" button
- Create listing form: vault, amount, price
- "Cancel" on own listings

### 5. Portfolio (`/portfolio`)
- USDC balance + vault token balances
- Current value (amount × NAV)
- "Claim" button when matured
- "Sell" button → marketplace

## Architecture

```
PrivyProvider → SolanaWalletProvider → AnchorProvider → App
```

## Hooks

- `useOxarProgram()` — typed Program<OxarProtocol>
- `useVaults()` — all vault accounts
- `useVault(id)` — single vault
- `useListings()` — all listings
- `usePortfolio()` — user balances
- `useDeposit()` — deposit USDC
- `useCreateListing()` / `useBuyListing()` / `useCancelListing()`
- `useClaim()` — claim after maturity
- `useCrankNav()` — update NAV

## Data

All data from Solana directly. No backend.
Devnet/localnet via `NEXT_PUBLIC_SOLANA_RPC_URL` env var.
