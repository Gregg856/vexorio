-- RX Queen history: staging-first, owner-isolated, no public access.
create table if not exists public.rx_queen_history (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 label text not null check (char_length(label) between 1 and 100),
 report jsonb not null check (jsonb_typeof(report) = 'object'),
 created_at timestamptz not null default now()
);
create index if not exists rx_queen_history_owner_created_idx on public.rx_queen_history(owner_id,created_at desc);
alter table public.rx_queen_history enable row level security;
revoke all on public.rx_queen_history from anon;
grant select, insert on public.rx_queen_history to authenticated;
create policy "rx_queen_history_owner_select" on public.rx_queen_history
 for select to authenticated using ((select auth.uid()) = owner_id);
create policy "rx_queen_history_owner_insert" on public.rx_queen_history
 for insert to authenticated with check ((select auth.uid()) = owner_id);
