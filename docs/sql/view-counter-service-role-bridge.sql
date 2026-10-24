-- STAGING DESIGN ONLY: do not apply to production until Edge gateway and frontend are ready.
-- The private implementation stays non-exposed. This narrow wrapper is for
-- service_role only; anon/authenticated/PUBLIC must not be able to execute it.
begin;
create or replace function public.vexorio_record_listing_view_server(
  p_listing_id bigint, p_visitor_digest text
) returns bigint
language sql security definer set search_path = ''
as $$
  select vexorio_private.record_listing_view_guarded(p_listing_id,p_visitor_digest)
$$;
revoke all on function public.vexorio_record_listing_view_server(bigint,text)
  from public, anon, authenticated;
grant execute on function public.vexorio_record_listing_view_server(bigint,text)
  to service_role;
commit;

-- Verify:
-- select has_function_privilege('anon',
--  'public.vexorio_record_listing_view_server(bigint,text)','EXECUTE'); -- false
-- select has_function_privilege('authenticated',
--  'public.vexorio_record_listing_view_server(bigint,text)','EXECUTE'); -- false
-- select has_function_privilege('service_role',
--  'public.vexorio_record_listing_view_server(bigint,text)','EXECUTE'); -- true
