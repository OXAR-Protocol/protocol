-- Two questions the volume table could not answer.
--
-- 1. WHICH MARKET. A flow recorded how many dollars moved and never what they were
--    exchanged for, so "is anyone using gold" had no answer. The mint on the other
--    side of the trade is right there in the transaction; it just wasn't kept.
alter table wallet_flows
  add column if not exists mint text,
  add column if not exists mint_amount numeric;

create index if not exists wallet_flows_mint_idx on wallet_flows (mint);

comment on column wallet_flows.mint is
  'The non-stable mint on the other side of the trade — the market the dollars went through.';
comment on column wallet_flows.mint_amount is
  'That mint''s net movement in UI units, signed: positive = the wallet received it.';

-- Our volume, split by the market it went through.
create or replace view oxar_volume_by_asset as
  select
    mint,
    count(*)                                   as transactions,
    coalesce(sum(spent_usd), 0)                as bought_usd,
    coalesce(sum(received_usd), 0)             as sold_usd,
    coalesce(sum(spent_usd + received_usd), 0) as volume_usd,
    count(distinct wallet)                     as wallets,
    max(ts)                                    as last_at
  from wallet_flows
  where origin <> 'unknown' and mint is not null
  group by mint;

comment on view oxar_volume_by_asset is 'Money moved through OXAR, per market.';

-- 2. HOW MUCH IS STILL THERE. Volume alone is ambiguous in the way that matters:
--    $1,000 of it is $1,000 that arrived and stayed, or $100 that went in and out
--    five times. For a yield product those are opposite outcomes.
--
--    Snapshots rather than a running total, because a balance is a fact about a
--    moment and yield accrues silently between them — a row per (moment, wallet,
--    mint) also makes AUM chartable over time without a second table.
create table if not exists holdings_snapshots (
  taken_at timestamptz not null,
  wallet text not null,
  mint text not null,
  ui_amount numeric not null,
  price_usd numeric not null,
  usd numeric not null,
  primary key (taken_at, wallet, mint)
);

create index if not exists holdings_snapshots_taken_idx on holdings_snapshots (taken_at desc);
create index if not exists holdings_snapshots_mint_idx on holdings_snapshots (mint);

alter table holdings_snapshots enable row level security;

comment on table holdings_snapshots is
  'What each wallet held at a moment, priced. Written by /api/volume-sync. service_role only.';

-- AUM as of the most recent snapshot. Its own subquery for the timestamp, so a
-- half-written snapshot cannot mix two moments into one total.
create or replace view oxar_aum as
  select
    taken_at,
    count(distinct wallet)         as wallets,
    count(distinct mint)           as assets,
    coalesce(sum(usd), 0)          as total_usd
  from holdings_snapshots
  where taken_at = (select max(taken_at) from holdings_snapshots)
  group by taken_at;

comment on view oxar_aum is 'Money under management right now, from the latest snapshot.';

create or replace view oxar_aum_by_asset as
  select
    mint,
    count(distinct wallet)  as wallets,
    coalesce(sum(usd), 0)   as total_usd
  from holdings_snapshots
  where taken_at = (select max(taken_at) from holdings_snapshots)
  group by mint;

comment on view oxar_aum_by_asset is 'What each market holds right now.';
