-- VEXORIO security hardening - REVIEW AND TEST ON SEPARATE STAGING SUPABASE FIRST.
-- Never apply directly to the shared preview/production database.
begin;
-- Prevent self-service privilege escalation. Current users may update their own profiles;
-- without column restrictions they can currently set role='admin'.
revoke insert, update on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant insert (id,display_name,country,city,created_at) on table public.profiles to authenticated;
grant update (display_name,country,city) on table public.profiles to authenticated;
-- Retain owner RLS for allowed columns. Role is controlled by server-side admin tooling only.
-- NOTE: Verify existing auth signup/profile trigger and any admin workflows in staging.

-- Restrict starting job conversations. Do not change conversations read/send policies yet;
-- they require a separate migration and tests for historical conversations.
drop policy if exists "Buyers can start conversations" on public.conversations;
create policy "Buyers can start conversations" on public.conversations
for insert to authenticated with check (
 buyer_id=(select auth.uid())
 and seller_id is not null
 and seller_id<>buyer_id
 and exists(
   select 1 from public.listings l
   where l.id=listing_id
   and l.owner_id=seller_id
   and (
      coalesce(l.rodzaj,'ogloszenie')<>'zlecenie'
      or public.has_contractor_premium((select auth.uid()))
   )
 )
);
-- CAUTION: Public listing details are STILL exposed by public.listings SELECT USING(true).
-- Do NOT advertise the service as secure until the listings SELECT policy and all
-- client queries have been migrated together.
commit;
