# @oxar/delora-monitor

Off-chain worker that keeps cross-chain yield NAVs in sync with on-chain Vault accounts.

## Why

`route_yield_deposit` on cross-chain sources (Ondo USDY, Mountain USDM, OpenEden TBILL, Sky sDAI, Ethena sUSDe) bridges USDC to Ethereum via Delora and holds the yield-bearing ERC-20 attributed to our vault PDA. The token rebases or appreciates off-chain. Solana doesn't see this growth.

This worker:
1. Lists all `Vault` accounts with `yield_source = DeloraCrossChain`
2. Fetches current USD value from Delora settlement state
3. Signs `crank_nav` with a dedicated cranker keypair to update `nav_per_share`

## Status

**Skeleton.** Compiles, has the loop structure, but:
- `listDeloraVaults` returns `[]`
- `pushCrankNav` logs intent without sending
- `DeloraClient.fetchNav` simulates yield from the catalogue `baseApy` table

Sprint 4 fills these in.

## Run locally

```bash
cd services/delora-monitor
cp .env.example .env  # edit Delora key + cranker keypair path
yarn install
yarn dev
```

## Deploy targets

For MVP — run on a single Fly.io / Render free-tier instance. Cron interval 1h is fine; NAV isn't a low-latency signal.

In prod also need:
- Sentry or Axiom for error tracking
- Cranker wallet funded with ~0.5 SOL (each `crank_nav` is ~5000 lamports)
- Alerting if cranker drifts on-chain NAV diverges from Delora by > 1% (suggests bug or bridge stall)
