-- pg_cron job that triggers /api/cron/snapshot every 5 minutes.
--
-- Replace <CRON_SECRET> with the actual CRON_SECRET value before running.
-- The committed file uses a placeholder so the secret never lands in git.
-- The deployed Supabase project has the secret embedded directly.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove any existing schedule with the same name so this migration is idempotent.
do $$
declare
  jid bigint;
begin
  for jid in select jobid from cron.job where jobname = 'radar-snapshot' loop
    perform cron.unschedule(jid);
  end loop;
end$$;

select cron.schedule(
  'radar-snapshot',
  '*/5 * * * *',
  $$
    select net.http_get(
      url := 'https://radar.oxar.app/api/cron/snapshot',
      headers := jsonb_build_object(
        'Authorization', 'Bearer <CRON_SECRET>'
      ),
      timeout_milliseconds := 25000
    )
  $$
);
