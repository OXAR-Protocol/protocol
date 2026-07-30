-- Evidence that a wallet was shown /terms and took an affirmative action
-- afterward (dismissed the welcome card, or started/skipped the tour — see
-- components/intro-modal.tsx). This is NOT a signature, and OXAR has no
-- operating company to be the counterparty for one; it records notice + act,
-- at a version and a time, nothing more.
--
-- Unique on (wallet, version) so re-triggering the welcome card (e.g. across
-- devices, or the X/skip/tour-finish paths all firing) upserts idempotently
-- instead of piling up rows. Bumping TERMS_VERSION in @oxar/sdk starts a fresh
-- row per wallet rather than silently inheriting an old acceptance.
create table if not exists terms_acceptances (
  id bigint generated always as identity primary key,
  wallet text not null,
  version text not null,
  ts timestamptz not null default now(),
  unique (wallet, version)
);

create index if not exists terms_acceptances_wallet_idx on terms_acceptances (wallet);

alter table terms_acceptances enable row level security;
-- No policies → only the service_role (server API) can read/write. The client
-- never queries this directly, same model as allowlist/waitlist.

comment on table terms_acceptances is 'Evidence a wallet was shown /terms and acted, keyed by wallet+version. Not a signature — OXAR has no operating company. service_role only.';
