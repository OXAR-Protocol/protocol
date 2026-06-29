-- Email allowlist for the closed alpha. Replaces the invite-key system.
-- Grant access: add the user's email as a row (Supabase Table editor).
-- Revoke access: delete the row. Lookup is case-insensitive (see /api/access/check).
create table if not exists allowlist (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

alter table allowlist enable row level security;
-- No policies → only the service_role (server API) can read/write. Same model as
-- the waitlist table; the client never queries this directly.

comment on table allowlist is 'Closed-alpha email allowlist. Checked server-side after Privy login. Add/remove rows to grant/revoke access.';

-- The old invite-key system is fully removed.
drop table if exists access_keys;
