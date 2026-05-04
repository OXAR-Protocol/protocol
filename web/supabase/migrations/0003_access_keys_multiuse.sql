-- Keys are no longer single-use. They stay valid until manually revoked,
-- so a user who wipes localStorage can re-enter the same key.
--
-- Track usage for analytics / sharing detection.

alter table access_keys
  add column if not exists first_used_at timestamptz,
  add column if not exists last_used_at timestamptz,
  add column if not exists use_count integer not null default 0,
  add column if not exists revoked_at timestamptz,
  add column if not exists note text;

comment on column access_keys.revoked_at is 'Set manually to disable a key (e.g. if shared publicly).';
comment on column access_keys.use_count is 'Number of successful redeems. High count = possible sharing.';

-- Backfill: keys already used under the old single-use flow should carry over.
update access_keys
   set first_used_at = used_at,
       last_used_at = used_at,
       use_count = 1
 where used_at is not null
   and first_used_at is null;
