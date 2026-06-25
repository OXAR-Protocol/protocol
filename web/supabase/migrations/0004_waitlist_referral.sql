-- Referral system for the waitlist. "Skip the line", two-sided.
-- Referrer gains GAIN(5) spots per confirmed referral; referred friend gets
-- HEAD_START(3). Invariant HEAD_START <= GAIN keeps the inviter ahead of their invitee.

alter table waitlist
  add column if not exists ref_code text unique,
  add column if not exists referred_by text,
  add column if not exists referral_count int not null default 0,
  add column if not exists head_start int not null default 0,
  add column if not exists referral_status text not null default 'confirmed'
    check (referral_status in ('pending', 'confirmed'));

-- Backfill share codes for existing rows. id (unique uuid) guarantees distinct inputs.
update waitlist
  set ref_code = upper(substr(md5(id::text), 1, 8))
  where ref_code is null;

create index if not exists waitlist_referred_by_idx on waitlist (referred_by);

-- Atomic referrer credit. Row-level update => no lost increments under concurrency.
create or replace function oxar_increment_referrals(p_ref_code text)
returns void language sql as $$
  update waitlist set referral_count = referral_count + 1 where ref_code = p_ref_code;
$$;

-- Queue rank for a row. priority = serial - head_start - GAIN*referral_count
-- (lower = closer to the front). GAIN=5 lives here as the single source for the math.
-- Ties broken by serial (earlier join wins) so position is deterministic.
create or replace function oxar_waitlist_rank(p_ref_code text)
returns table(pos bigint, total bigint, referrals int)
language sql stable as $$
  with me as (
    select serial,
           serial - head_start - referral_count * 5 as prio,
           referral_count
    from waitlist
    where ref_code = p_ref_code
  )
  select
    (select count(*)
       from waitlist w, me
       where (w.serial - w.head_start - w.referral_count * 5) < me.prio
          or ((w.serial - w.head_start - w.referral_count * 5) = me.prio
              and w.serial < me.serial)) + 1,
    (select count(*) from waitlist),
    (select referral_count from me);
$$;

comment on function oxar_waitlist_rank is 'Effective queue position; GAIN=5 must stay in sync with the API HEAD_START=3 (invariant HEAD_START <= GAIN).';
