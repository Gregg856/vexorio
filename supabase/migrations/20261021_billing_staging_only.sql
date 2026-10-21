-- VEXORIO: STAGING ONLY. Do not apply to shared production Supabase without review.
-- Subscriptions and advertisements are separate products. No free trial.
create table if not exists public.billing_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null check (provider in ('stripe')),
 provider_customer_id text,
 provider_subscription_id text unique,
 status text not null default 'pending' check (status in ('pending','active','past_due','canceled','unpaid')),
 current_period_end timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists billing_subscriptions_user_idx on public.billing_subscriptions(user_id);
alter table public.billing_subscriptions enable row level security;
drop policy if exists "Subscribers can read own subscription" on public.billing_subscriptions;
create policy "Subscribers can read own subscription" on public.billing_subscriptions for select to authenticated using (user_id=(select auth.uid()));
-- Intentionally no INSERT/UPDATE/DELETE policy for authenticated clients.
-- Only a verified, signature-checked payment webhook using server credentials may write.
create table if not exists public.billing_events (
 provider text not null,
 provider_event_id text not null,
 processed_at timestamptz not null default now(),
 primary key (provider,provider_event_id)
);
alter table public.billing_events enable row level security;
-- No client policies: only server credentials may read/write event deduplication.
create table if not exists public.business_promotions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 listing_id bigint references public.listings(id) on delete cascade,
 provider text not null default 'stripe',
 provider_payment_id text unique,
 status text not null default 'pending' check(status in ('pending','active','expired','refunded')),
 starts_at timestamptz,
 ends_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.business_promotions enable row level security;
drop policy if exists "Advertisers can read own promotions" on public.business_promotions;
create policy "Advertisers can read own promotions" on public.business_promotions for select to authenticated using (user_id=(select auth.uid()));
-- Never grant self-activation for advertising or subscriptions.
create or replace function public.has_contractor_premium(p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
 select 1 from public.billing_subscriptions s
 where s.user_id=p_user_id and s.status='active'
 and s.current_period_end>now()
 )
$$;
revoke all on function public.has_contractor_premium(uuid) from public;
grant execute on function public.has_contractor_premium(uuid) to authenticated;
-- TODO before production:
-- 1. Move public listings to a safe public summary view and protect job details with RLS.
-- 2. Require has_contractor_premium(auth.uid()) for initiating job conversations.
-- 3. Block role escalation via public.profiles owner INSERT/UPDATE.
-- 4. Verify payment provider webhook signatures and deduplicate billing_events.
-- 5. Test user/owner/subscriber/admin cases against a separate staging Supabase project.
