# OXAR Radar — Supabase

All Radar tables live in the `radar` schema of the existing OXAR
Supabase project (`ufxlaqxorpsvfvraogqy`). The `public` schema is left
alone — that's where the waitlist form on `oxar.app` writes.

## Apply migrations

Two equivalent paths.

### Option A — Supabase Dashboard SQL Editor

1. https://supabase.com/dashboard/project/ufxlaqxorpsvfvraogqy/sql/new
2. Paste contents of the next un-applied file from `migrations/`
3. Run

### Option B — psql against the EU-West-1 pooler

```bash
PGPASSWORD="<db_password>" psql \
  "host=aws-0-eu-west-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.ufxlaqxorpsvfvraogqy sslmode=require" \
  -f radar/supabase/migrations/0001_radar_schema.sql
```

All migrations are idempotent — re-running is safe.

Phase 3 swaps this for the Supabase CLI (`supabase db push`) once we
want change-tracking and CI-driven migrations.

## Seed

`migrations/0002_seed_protocols.sql` is the canonical seed for
`radar.protocols`. Apply it the same way as `0001`. Idempotent via
ON CONFLICT (slug), so re-applying after editing the registry picks
up changes.

A TypeScript alternative (`packages/radar-core/scripts/seed-protocols.ts`)
exists for parity, but it requires `radar` to be in PostgREST's
exposed schemas list (Dashboard → Settings → API → Exposed Schemas).
Until that's enabled, prefer the SQL seed via psql.

## Schemas

| Table | Purpose | Writer |
|-------|---------|--------|
| `radar.protocols` | RWA protocol registry (slug, chain, contract, APY) | Seed script + admin |
| `radar.protocol_snapshots` | NAV/TVL/holders every 5 min | Indexer (pg_cron) |
| `radar.protocol_events` | Pause/upgrade/large-outflow events | Indexer |
| `radar.wallet_analyses_cache` | 5-min TTL cache for analyze responses | API route |
| `radar.api_keys` | Hashed customer API keys | Dashboard |
| `radar.api_usage` | Append-only request log | Middleware |

## RLS

All tables have RLS enabled with **no** policies. That means anything
goes through the service-role key (server-only). The anon key has
zero access to `radar.*` — intentional, since this is B2B data.
