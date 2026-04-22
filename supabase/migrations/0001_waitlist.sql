create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  serial bigserial unique,
  email text not null unique,
  amount_usd numeric not null check (amount_usd >= 0),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;

comment on table waitlist is 'OXAR early access waitlist signups. service_role only.';
