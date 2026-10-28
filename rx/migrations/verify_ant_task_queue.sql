-- RX AUTOPRACA 2.0 staging verification (read-only).
-- Run after reviewing/applying 001_ant_task_queue.sql to STAGING.
select n.nspname as table_schema, c.relname as table_name, c.relrowsecurity as row_security
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='rx_private'
  and c.relkind='r'
  and c.relname in ('ant_task_queue','ant_task_events')
order by c.relname;

select table_name, column_name, data_type
from information_schema.columns
where table_schema='rx_private'
  and table_name in ('ant_task_queue','ant_task_events')
order by table_name, ordinal_position;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema='rx_private'
  and table_name in ('ant_task_queue','ant_task_events')
  and grantee in ('anon','authenticated')
order by grantee, table_name;

-- Expected: two RLS-enabled tables, required columns, and zero
-- grants for anon/authenticated. No task execution is performed.
