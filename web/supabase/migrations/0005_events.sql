-- Lightweight app-level money-flow analytics: one row per confirmed money action
-- (deposit / withdraw / buy / send), for ANY wallet (embedded + connected) — the
-- aggregate volume/TVL number Privy can't give us (it only sees embedded wallets).
-- Server-only (service_role); on-chain data is public, we just record USD value.

create table if not exists events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  wallet text not null,
  kind text not null,             -- deposit | withdraw | buy | send
  asset text,                     -- provider/asset id, e.g. jupiter-lend-usdc, xstock-aapl
  usd numeric check (usd >= 0),   -- USD value of the action
  sig text unique,                -- tx signature — dedup (on conflict do nothing)
  chain text                      -- solana | ethereum
);

create index if not exists events_ts_idx on events (ts);
create index if not exists events_kind_idx on events (kind);

alter table events enable row level security;

comment on table events is 'OXAR money-flow analytics (deposit/withdraw/buy/send). service_role only.';
