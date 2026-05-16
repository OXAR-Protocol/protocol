# @oxar/radar-core

Shared business logic for OXAR Radar — wallet analysis, risk scoring, multi-chain data fetchers, and AI explain layer.

This package is consumed by:

- `radar/` — Next.js app on `radar.oxar.app` (UI + API routes)
- Future `radar-indexer/` — background cron service
- Future `mobile/` — React Native client

## Structure

```
src/
├── types/         Shared types (ProtocolMetadata, WalletAnalysis, RiskScore, ...)
├── chains/        Chain adapters: ethereum (Alchemy), solana (Helius)
├── protocols/     Registry of supported RWA protocols (Ondo, Maple, ...)
├── analyze/       Pure wallet analysis: positions, risk scores, concentration
└── explain/       Claude Haiku 4.5 wrapper: plain-language portfolio summary
```

## Status

Phase 1, Day 1-2 (2026-05-15): scaffold + types + interfaces. Implementations stubbed.

See `docs/plans/2026-05-15-oxar-radar-design.md` for the full design.
