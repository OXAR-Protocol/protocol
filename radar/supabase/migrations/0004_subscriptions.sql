-- Subscriptions store Stripe customer + subscription state per user.
-- Phase 3.1 wires this from the Stripe webhook; Helio Pay adds a
-- parallel column set in Phase 3.2.

create table if not exists radar.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                text not null unique,
  tier                   text not null check (tier in ('free', 'starter', 'pro', 'enterprise')),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text not null default 'inactive',
  current_period_end     timestamptz,
  payment_channel        text,  -- 'stripe' | 'helio'
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_status_idx
  on radar.subscriptions (status) where status = 'active';

alter table radar.subscriptions enable row level security;

drop trigger if exists subscriptions_set_updated_at on radar.subscriptions;
create trigger subscriptions_set_updated_at
  before update on radar.subscriptions
  for each row execute function radar.set_updated_at();
