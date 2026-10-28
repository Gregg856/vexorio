-- Staging-only migration already applied to Supabase.
-- Reader is intentionally NOLOGIN until secret provisioning.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='rx_queen_queue_reader') then
  create role rx_queen_queue_reader nologin noinherit nobypassrls;
 end if;
end $$;
grant usage on schema rx_private to rx_queen_queue_reader;
grant select on rx_private.ant_task_queue to rx_queen_queue_reader;
revoke all on rx_private.ant_task_events from rx_queen_queue_reader;
drop policy if exists rx_queen_queue_reader_select on rx_private.ant_task_queue;
create policy rx_queen_queue_reader_select on rx_private.ant_task_queue for select to rx_queen_queue_reader using (true);
