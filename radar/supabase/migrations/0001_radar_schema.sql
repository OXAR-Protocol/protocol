-- OXAR Radar — initial schema
-- Lives in `radar` schema to stay isolated from existing `public.waitlist`.
-- Run in Supabase Dashboard → SQL Editor. Idempotent: re-running is a no-op.

create schema if not exists radar;

-- 1. Protocols registry (mirrors the static one in radar-core for now;
--    will become the source of truth in Phase 2.3+).

create table if not exists radar.protocols (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  name                 text not null,
  chain                text not null check (chain in ('ethereum', 'solana')),
  category             text not null,
  contract_address     text not null,
  decimals             smallint not null,
  description          text,
  issuer_name          text not null,
  issuer_jurisdiction  text,
  website_url          text,
  estimated_apy_bps    integer not null default 0,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create unique index if not exists protocols_chain_contract_idx
  on radar.protocols (chain, lower(contract_address));

-- 2. Time-series snapshots (NAV, TVL, holders). Indexer writes here every 5 min.

create table if not exists radar.protocol_snapshots (
  id                       bigserial primary key,
  protocol_id              uuid not null references radar.protocols(id) on delete cascade,
  ts                       timestamptz not null default now(),
  nav                      numeric(20, 8),
  tvl                      numeric(20, 2),
  holder_count             integer,
  apy_bps                  integer,
  top10_concentration_pct  numeric(5, 2),
  redemption_queue_usd     numeric(20, 2)
);

create index if not exists protocol_snapshots_protocol_ts_idx
  on radar.protocol_snapshots (protocol_id, ts desc);

-- 3. Discrete events: pause, upgrade, large outflow, ownership transfer.

create table if not exists radar.protocol_events (
  id           bigserial primary key,
  protocol_id  uuid not null references radar.protocols(id) on delete cascade,
  ts           timestamptz not null default now(),
  event_type   text not null,
  severity     text not null check (severity in ('info', 'warning', 'critical')),
  payload      jsonb not null default '{}'::jsonb
);

create index if not exists protocol_events_protocol_ts_idx
  on radar.protocol_events (protocol_id, ts desc);

-- 4. Wallet-analysis cache. 5-minute TTL; cleanup is a separate cron.

create table if not exists radar.wallet_analyses_cache (
  id              bigserial primary key,
  wallet_address  text not null,
  chain           text not null,
  ts              timestamptz not null default now(),
  positions       jsonb not null,
  risk_score      smallint not null,
  expires_at      timestamptz not null
);

create unique index if not exists wallet_cache_addr_chain_idx
  on radar.wallet_analyses_cache (lower(wallet_address), chain);

create index if not exists wallet_cache_expires_idx
  on radar.wallet_analyses_cache (expires_at);

-- 5. API keys. user_id is nullable to allow CLI-issued enterprise keys.

create table if not exists radar.api_keys (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid,
  name                text,
  key_hash            text not null unique,
  key_prefix          text not null,
  tier                text not null check (tier in ('free', 'starter', 'pro', 'enterprise')),
  rate_limit_per_min  integer not null default 60,
  monthly_quota       integer not null default 10000,
  created_at          timestamptz not null default now(),
  last_used_at        timestamptz,
  revoked_at          timestamptz
);

create index if not exists api_keys_user_idx on radar.api_keys (user_id);
create index if not exists api_keys_active_idx
  on radar.api_keys (revoked_at) where revoked_at is null;

-- 6. Usage log. Append-only; indexer rolls up monthly into materialized view in Phase 3.

create table if not exists radar.api_usage (
  id           bigserial primary key,
  api_key_id   uuid not null references radar.api_keys(id) on delete cascade,
  ts           timestamptz not null default now(),
  endpoint     text not null,
  method       text not null,
  status_code  smallint not null,
  latency_ms   integer
);

create index if not exists api_usage_key_ts_idx
  on radar.api_usage (api_key_id, ts desc);

-- 7. RLS — everything is service_role-only. No public policies.
--    The Next.js server hits these via SUPABASE_SERVICE_ROLE_KEY, which
--    bypasses RLS by design. Anon key has zero access.

alter table radar.protocols              enable row level security;
alter table radar.protocol_snapshots     enable row level security;
alter table radar.protocol_events        enable row level security;
alter table radar.wallet_analyses_cache  enable row level security;
alter table radar.api_keys               enable row level security;
alter table radar.api_usage              enable row level security;

-- 8. updated_at trigger for protocols.

create or replace function radar.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protocols_set_updated_at on radar.protocols;
create trigger protocols_set_updated_at
  before update on radar.protocols
  for each row execute function radar.set_updated_at();
