create table if not exists access_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  used_at timestamptz,
  used_by_ip text,
  token_hash text,
  created_at timestamptz not null default now()
);

alter table access_keys enable row level security;

comment on table access_keys is 'Single-use early-access invite keys. DB stores sha256 hashes only — plain keys never logged.';
comment on column access_keys.token_hash is 'sha256 of session token issued on redeem; for future session revocation.';
