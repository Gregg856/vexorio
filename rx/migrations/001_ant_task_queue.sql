-- RX AUTOPRACA 2.0: isolated, approval-gated task queue.
-- Apply to STAGING only after reviewing existing rx_private objects.
create schema if not exists rx_private;

create table if not exists rx_private.ant_task_queue (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('queen_chat','tech_help','coordinator','admin')),
  task_type text not null check (task_type in ('repository_audit','ci_status','safe_test')),
  title text not null check (char_length(title) between 1 and 240),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending_approval'
    check (status in ('pending_approval','approved','running','succeeded','failed','cancelled')),
  requested_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rx_ant_task_approval_consistency check (
    (status = 'pending_approval' and approved_at is null and approved_by is null)
    or (status = 'cancelled')
    or (status in ('approved','running','succeeded','failed')
      and approved_at is not null and approved_by is not null)
  )
);

create index if not exists rx_ant_task_queue_status_created_idx
  on rx_private.ant_task_queue(status, created_at);

create table if not exists rx_private.ant_task_events (
  id bigint generated always as identity primary key,
  task_id uuid not null references rx_private.ant_task_queue(id) on delete cascade,
  event_type text not null,
  actor_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists rx_ant_task_events_task_created_idx
  on rx_private.ant_task_events(task_id, created_at);

alter table rx_private.ant_task_queue enable row level security;
alter table rx_private.ant_task_events enable row level security;

-- No anon/authenticated grants or policies: browser clients cannot directly
-- enqueue, approve, or run tasks. Authenticated admin server endpoints must
-- validate membership and call the DB with server-only credentials.
revoke all on rx_private.ant_task_queue from anon, authenticated;
revoke all on rx_private.ant_task_events from anon, authenticated;
revoke all on sequence rx_private.ant_task_events_id_seq from anon, authenticated;

comment on table rx_private.ant_task_queue is
  'RX AUTOPRACA 2.0 staging queue; no executor or API is enabled by this migration.';
