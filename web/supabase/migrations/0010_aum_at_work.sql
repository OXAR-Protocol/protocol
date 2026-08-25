-- "$3,703 under management" was true and useless: $3,490 of it was USDC sitting
-- untouched in wallets. Cash a user has not deployed is not money we are managing,
-- and a single total that mixes the two flatters the number by 17x.
--
-- Both figures are kept, because both are real questions. What is AT WORK is how the
-- product is doing. What is IDLE is the money already inside the door that hasn't
-- been put anywhere — the most convertible demand there is.
--
-- The split is by mint: the stable basket is cash, everything else is a position.
-- Dropped rather than replaced: `create or replace view` refuses to rename or
-- reorder columns, and this changes both.
drop view if exists oxar_aum;

create view oxar_aum as
  with cash as (
    select unnest(array[
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  -- USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',  -- USDT
      '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH'   -- USDG
    ]) as mint
  )
  select
    s.taken_at,
    count(distinct s.wallet)                                                as wallets,
    count(distinct s.wallet) filter (where s.mint not in (select mint from cash))
                                                                            as wallets_at_work,
    coalesce(sum(s.usd) filter (where s.mint not in (select mint from cash)), 0)
                                                                            as at_work_usd,
    coalesce(sum(s.usd) filter (where s.mint in (select mint from cash)), 0) as idle_cash_usd,
    coalesce(sum(s.usd), 0)                                                 as total_usd
  from holdings_snapshots s
  where s.taken_at = (select max(taken_at) from holdings_snapshots)
  group by s.taken_at;

comment on view oxar_aum is
  'Money under management. at_work_usd is the headline — idle_cash_usd is dollars sitting in wallets, not deployed.';
