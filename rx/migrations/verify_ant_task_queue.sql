-- RX AUTOPRACA 2.0 staging verification (read-only).
-- Run after reviewing/applying 001_ant_task_queue.sql to STAGING.
select table_schema, table_name, row_security
from information_schema.tables t
join pg_class c on c.relname=t.table_name
join pg_namespace n on n.oid=c.relnamespace and n.nspname=t.table_schema
where t.table_schema='rx_private'
  and t.table_name in ('ant_task_queue','ant_task_events')
order by table_name;

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
