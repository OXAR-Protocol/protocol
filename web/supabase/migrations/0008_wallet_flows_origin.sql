-- How we know a transaction came through us.
--
-- The chain is the honest source for the AMOUNT and a useless one for the AUTHOR. A
-- wallet that trades on Jupiter directly leaves a transaction indistinguishable from
-- one our screen built, so the first read of this table reported $1,924 of "our
-- volume" when $327 of it belonged to other people's apps.
--
--   'relayer'  — our gasless relayer paid the network fee. Nothing else can put that
--                address there, so it is proof rather than a guess, and it covers the
--                ordinary path: a wallet holding no SOL.
--   'recorded' — the browser reported the signature to /api/track. Weaker (a closed
--                tab never reports) but never wrong in the other direction.
--   'unknown'  — someone else's app, or ours on a path we cannot yet mark.
--
-- Every row is kept, including 'unknown'. Deleting them would leave no way to see how
-- much of a wallet's life we are missing, and that ratio is the thing to watch as
-- marking improves.
alter table wallet_flows
  add column if not exists origin text not null default 'unknown';

create index if not exists wallet_flows_origin_idx on wallet_flows (origin);

comment on column wallet_flows.origin is
  'relayer = our gasless relayer paid the fee (proof) | recorded = the client reported it | unknown = not ours, or ours on an unmarked path';

-- Our volume, as one number, so nothing has to re-derive the filter.
create or replace view oxar_volume as
  select
    count(*)                                        as transactions,
    coalesce(sum(spent_usd), 0)                     as spent_usd,
    coalesce(sum(received_usd), 0)                  as received_usd,
    coalesce(sum(spent_usd + received_usd), 0)      as volume_usd,
    count(distinct wallet)                          as wallets,
    min(ts)                                         as first_at,
    max(ts)                                         as last_at
  from wallet_flows
  where origin <> 'unknown';

comment on view oxar_volume is
  'Money moved through OXAR. Excludes what these wallets did in other apps.';
