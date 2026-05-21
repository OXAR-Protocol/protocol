# OXAR Radar — Design Document

**Date:** 2026-05-15
**Status:** Approved, ready for Phase 1 implementation
**Owner:** OXAR core team

---

## Overview

OXAR Radar is an API-first intelligence layer for the Real World Assets (RWA) market. It indexes RWA protocols across Ethereum and Solana, provides risk monitoring and wallet analytics, and exposes everything via REST API for B2B customers (DAO treasuries, crypto funds, RWA protocols, small institutions). A public web demo at `radar.oxar.app/analyze` provides a viral acquisition surface that runs on the same API internally.

Strategic role for OXAR Protocol:

- Generates SaaS revenue while legal structure for the main protocol is being finalized
- Builds brand authority as "RWA intelligence" specialists
- Creates audience funnel for the main protocol launch
- Operates under information-service / SaaS legal category (no licenses required)

---

## Architecture Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Where does Radar live? | **B** — Sibling Next.js app in monorepo, `radar.oxar.app` subdomain |
| 2 | What is v0.1? | **API-first**. Wallet analyzer + protocol data endpoints. Public demo on top. No Telegram bot. |
| 3 | Data layer | **Supabase** (Postgres) |
| 4 | Chains in v0.1 | **Ethereum + Solana** (both — Ethereum for market coverage, Solana for unique edge) |
| 5 | AI in v0.1 | **Yes, from day 1.** Claude Haiku 4.5 with prompt caching |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 16 (App Router, Route Handlers under `/api/v1/*`) |
| Data | Supabase (Postgres + Auth) |
| AI | Anthropic SDK + Claude Haiku 4.5 with prompt caching |
| Indexer | Supabase pg_cron (free), Vercel Cron as backup |
| Payments | Stripe |
| Auth | Privy (dashboard) + custom API keys (B2B) |
| Rate limiting | Upstash Redis (free tier) |
| Deploy | Vercel, `radar.oxar.app` |

---

## Monorepo Layout

```
oxar-monorepo/
├── web/                      ← existing protocol app, untouched
├── radar/                    ← new Next.js app on radar.oxar.app
│   ├── src/app/
│   │   ├── page.tsx              landing
│   │   ├── analyze/              public AI demo
│   │   ├── docs/                 API documentation
│   │   ├── dashboard/            API keys, usage, billing
│   │   ├── pricing/page.tsx
│   │   └── api/v1/               B2B endpoints
│   └── package.json
│
├── packages/
│   └── radar-core/           ⭐ shared business logic
│       ├── src/
│       │   ├── chains/           ethereum + solana data adapters
│       │   ├── protocols/        Ondo, Maple, Centrifuge, etc.
│       │   ├── analyze/          wallet analysis + risk scoring
│       │   ├── explain/          Claude Haiku wrapper
│       │   └── types/            shared TypeScript types
│       └── package.json
│
├── sdk/                      ← existing protocol SDK
└── contracts/                ← existing
```

**Principles:**

1. No business logic in `radar/` — only UI and thin API routes
2. All analytics, data fetching, AI calls live in `packages/radar-core`
3. Future mobile app imports `radar-core` directly — no duplication
4. Indexer and API use the same `radar-core` — data consistency guaranteed

---

## Data Layer (Supabase)

```sql
protocols (
  id, slug, name, chain, category,
  contract_address, decimals,
  data_source, is_active
)

protocol_snapshots (
  protocol_id, timestamp,
  nav, tvl, holder_count,
  apy_bps, top10_concentration_pct,
  redemption_queue_size
)

protocol_events (
  protocol_id, timestamp, event_type,
  severity, payload_jsonb
)

wallet_analyses_cache (
  wallet_address, chain, timestamp,
  positions_jsonb, risk_score, expires_at
)

api_keys (
  id, user_id, key_hash, tier,
  rate_limit_per_min, created_at, revoked_at
)

api_usage (
  api_key_id, endpoint, timestamp,
  status_code, latency_ms
)
```

## Indexer

| Job | Frequency | Purpose |
|-----|-----------|---------|
| `nav-snapshot` | every 5 min | Fetch NAV/TVL for active protocols |
| `holder-snapshot` | every hour | Holder concentration, top10 wallets |
| `event-watcher` | every 15 min | Smart-contract events (Paused, Upgraded, OwnershipTransferred) |

**Runtime:** Supabase pg_cron (free tier). Vercel Cron as a fallback for non-DB tasks.

## Data Sources

| Chain | Provider | Used For |
|-------|----------|----------|
| Solana | Helius (already paid) | RPC + Enhanced API for holders |
| Ethereum | Alchemy (free tier) | RPC + Token API for holders |
| Protocol-specific | Ondo API, Maple subgraph, Centrifuge GraphQL | Issuer metadata when on-chain is insufficient |

---

## API Design

**Base URL:** `https://radar.oxar.app/api/v1`

### Endpoints

```
POST /analyze/wallet
  Body: { address, chains: ["ethereum", "solana"] }
  Returns: { positions, risk_score, concentration, duration, ... }
  Auth: API key OR session (rate-limited anonymous for public demo)

POST /explain/wallet
  Body: { address, chains, language: "en" | "ru" | "pl" }
  Returns: { summary_text, risks_text, recommendations_text }
  Auth: API key (paid tier only)
  AI: Claude Haiku 4.5 + prompt caching

GET /protocols
  Returns: list of supported protocols

GET /protocols/:slug
  Returns: current snapshot (NAV, TVL, health score)

GET /protocols/:slug/history?range=7d|30d|90d
  Returns: time-series for charts

GET /protocols/:slug/events?since=timestamp
  Returns: events (pause, upgrade, large outflow)

WS /stream  (Phase 2)
  Subscribe: { protocols: [...], wallet: "..." }
```

### Auth

- **Dashboard users** (developers managing API keys) → Privy login
- **API consumers** → header `Authorization: Bearer rdr_live_xxx`. Keys hashed with bcrypt in `api_keys`, validated in middleware.

### Pricing Tiers

| Tier | Price/mo | Rate limit | AI explain | Endpoints |
|------|----------|------------|------------|-----------|
| Free | $0 | 60/min, 10k/mo | – | analyze + protocols |
| Starter | $99 | 600/min, 100k/mo | 1k calls/mo | + history, events |
| Pro | $499 | 6000/min, 1M/mo | 10k calls/mo | + WebSocket (Phase 2) |
| Enterprise | custom | unlimited | unlimited | + SLA, white-label |

### AI Integration

Claude Haiku 4.5 with prompt caching:

- System prompt (~2000 tokens) — RWA analyst framework, risk categories, glossary — cached (5min TTL)
- User message — per-wallet portfolio JSON
- Cost per cached call: ~$0.0008
- Cost without cache: ~$0.005
- Expected cache hit rate at scale: 90%+

### Rate Limiting

Upstash Redis (free tier 10k commands/day for MVP), sliding window per API key.

### Idempotency

All POST endpoints accept `Idempotency-Key` header.

---

## Frontend Pages

```
radar/src/app/
├── page.tsx                  landing: hero, "Try it free", pricing, customers
├── analyze/page.tsx          ⭐ public viral demo
├── docs/                     Mintlify-style via fumadocs or nextra
├── dashboard/
│   ├── page.tsx              usage overview
│   ├── keys/page.tsx         create/rotate/revoke
│   ├── billing/page.tsx      Stripe customer portal embed
│   └── usage/page.tsx        charts: requests, errors, latency
└── pricing/page.tsx
```

### Public Demo `/analyze`

The viral acquisition surface.

1. Wallet address input (Ethereum or Solana)
2. "Analyze" button — no login required for N requests/day per IP
3. Results:
   - Left: pie chart of positions by protocol, bar chart by chain, risk gauge
   - Right: Claude-generated plain-language explanation
4. CTA: "Get this via API — start free" → `/dashboard`

**SEO and sharing:**

- Stateful URL: `radar.oxar.app/analyze?wallet=0xABC...`
- Dynamic OG image via Vercel OG: risk score + breakdown — Twitter previews look like product, not stock image

### Design

- Reuse existing system from `web/` (Radix + shadcn, Geist, OXAR icons)
- Dark theme by default

### Docs

- `fumadocs` or `nextra` template (no custom solution)
- Reference auto-generated from OpenAPI spec (declared via Zod schemas in code)

### Dashboard

- `tremor.so` for charts (free, professional-looking out of the box)

---

## Implementation Phases

### Phase 1 — Foundation + Viral Demo (Weeks 1-2, → 2026-05-29)

**Goal:** ship public demo with AI, start building Twitter audience.

| Day | Work |
|-----|------|
| 1-2 | Scaffold monorepo: `radar/`, `packages/radar-core/`. Vercel project. Supabase schema. |
| 3-5 | Wallet analyzer for Ethereum: `radar-core/chains/ethereum.ts` (Alchemy), `radar-core/protocols/` (Ondo, Maple, Centrifuge, BlackRock BUIDL, Backed), `radar-core/analyze/wallet.ts`. |
| 6-8 | AI explain layer: `radar-core/explain/wallet.ts` (Claude Haiku 4.5 + prompt caching, system prompt, glossary, examples). |
| 9-11 | Public page `/analyze`: UI, OG image generator, share buttons, per-IP rate limit. |
| 12-14 | Solana chain support (`radar-core/chains/solana.ts` via Helius) + soft launch on Twitter. |

**Exit criterion:** public demo works, AI gives reasonable responses, 100+ analyses run without errors.

### Phase 2 — Protocol Data API (Weeks 3-4, → 2026-06-12)

**Goal:** B2B API ready to sell.

- Indexer: pg_cron for NAV/TVL/holders/events
- Endpoints: `/protocols`, `/protocols/:slug`, `/history`, `/events`
- API key system: creation, rotation, rate limiting via Upstash Redis
- OpenAPI spec, docs site (`fumadocs` or `nextra`)
- Outreach starts: list of 30 RWA protocols and 50 DAO treasuries

### Phase 3 — Monetization (Week 5, → 2026-06-19)

- Stripe integration + customer portal
- Dashboard: API keys, usage, billing
- 4 pricing tiers active
- Self-serve flow: signup → API key in 60 seconds

### Phase 4 — Sales & Iteration (Weeks 6-10, → end of July)

- Direct outreach: LinkedIn DM, Twitter, ETH/Solana events
- Target: 3 paying customers by 2026-07-31
- Weekly iteration on early user feedback

---

## Budget

Free-tier first. Real spend = Anthropic API only.

| Service | Free tier covers Phase 1? | Note |
|---------|---------------------------|------|
| Vercel Hobby | Yes | 100GB bandwidth/mo, unlimited deploys |
| Supabase Free | Yes | 500MB Postgres, 50k MAU, 2GB egress |
| Upstash Redis Free | Yes | 10k commands/day |
| Alchemy Free | Yes | 300M compute units/mo |
| Helius | Yes (already paid) | Solana RPC |
| Stripe | Yes until first transaction | Then 2.9% + $0.30 |
| Domain | Yes | `radar.oxar.app` subdomain of existing |
| Anthropic API | $5 minimum deposit | Pay-as-you-go, ~5000 AI calls |

**Phase 1 total cost: $5.**

**Realistic total to first paying customer: $20-30.**

### Cron Gotcha

Vercel Hobby allows only 2 cron jobs at 1x/day. Workaround: **Supabase pg_cron** (free, up to 64 jobs, runs inside Postgres). Used in Phase 2 when indexer ships.

---

## Future Work (Phase 2+)

- WebSocket streaming for real-time data
- Discord webhook delivery for DAO treasuries
- L2 support: Base, Arbitrum
- Premium AI features: scenario modeling, custom risk rules
- White-label dashboards for enterprise tier
- Mobile app reusing `radar-core` directly
