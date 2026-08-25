-- Money flow read from the chain, not reported by the browser.
--
-- `events` stays where it is and keeps doing the one job on-chain data cannot do:
-- attributing a wallet to the invite channel it arrived through. It is no longer the
-- source of volume figures. It recorded intentions posted from the client — a typed
-- amount that a clamped swap never spent, a post that a closed tab never sent — and
-- one row landed at $7,997 for a transaction that moved $11.45.
--
-- A settled transaction states its own size. This table holds one row per transaction
-- that moved stable coin against a position, keyed by signature so a re-sync of the
-- same history is a no-op rather than a double count.
create table if not exists wallet_flows (
  sig text primary key,                                  -- tx signature — dedup across re-syncs
  wallet text not null,
  ts timestamptz not null,                               -- block time, not when we recorded it
  spent_usd numeric not null default 0 check (spent_usd >= 0),
  received_usd numeric not null default 0 check (received_usd >= 0)
);

create index if not exists wallet_flows_wallet_idx on wallet_flows (wallet);
create index if not exists wallet_flows_ts_idx on wallet_flows (ts);

alter table wallet_flows enable row level security;
-- No policies → service_role only, same model as `events` and `allowlist`.

comment on table wallet_flows is
  'On-chain money flow per transaction (stable-coin leg). Written by /api/volume-sync. service_role only.';

-- Where the next read starts. Paging is bounded by `since` (a timestamp), so this is
-- the block time of the newest flow we have — not a signature. A wallet absent from
-- this table has never been synced and gets read from the beginning of its life.
create table if not exists wallet_sync (
  wallet text primary key,
  synced_through timestamptz,                            -- newest flow we hold; null = never synced
  synced_at timestamptz not null default now(),          -- when the job last looked
  last_error text                                        -- why the last look came back short
);

alter table wallet_sync enable row level security;

comment on table wallet_sync is
  'Per-wallet cursor for the on-chain volume sync. service_role only.';
