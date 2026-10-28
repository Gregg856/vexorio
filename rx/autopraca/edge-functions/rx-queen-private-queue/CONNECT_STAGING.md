# RX Queen — staging gateway connection checklist

Deployment: `rx-queen-private-queue` v1 ACTIVE, `verify_jwt=true`, project `owkjdlpawczrnwyszduj`.

## Required secrets
- `SUPABASE_URL`: automatically injected staging project URL.
- `SUPABASE_ANON_KEY`: staging publishable/anon key, server environment only in this gateway.
- `RX_STAGING_DATABASE_URL`: **new, dedicated read-only Postgres login**, secret stored only in Supabase Edge Function secrets; never commit the URL or password.
- `RX_QUEEN_GATEWAY_ORIGIN`: trusted Cloudflare Worker origin when browser Origin is present.

## Database privileges
Create a dedicated LOGIN role with a generated high-entropy password (outside source control), NOINHERIT, no BYPASSRLS. Grant USAGE on `rx_private` and SELECT only on `rx_private.ant_task_queue`. Since RLS is enabled, add a narrow SELECT policy **TO that role only**. Do not grant access to `ant_task_events`, `ant_memory`, `dna_lineage_memory`, or any other private tables. Do not expose `rx_private` to PostgREST. Verify permissions with `has_schema_privilege`, `has_table_privilege`, and `pg_policies`.

**Caution:** An Edge Function may need a Supabase pooler hostname such as `*.pooler.supabase.com` rather than a direct database hostname. The v1 gateway currently rejects pooler hosts, so validate the exact staging host and adapt the allowlist safely before enabling credentials.

## Validation gates
1. Verify the Edge Function has a working Deno runtime and responds 401 to missing/invalid JWT (Supabase gateway may reject before function code).
2. Confirm expired JWT and non-admin requests fail.
3. Confirm a staging admin GET returns `{ok:true,source:'supabase-staging',tasks:[]}` with an empty queue.
4. Confirm direct browser access to `rx_private` still fails.
5. Confirm production Supabase URL fails closed.
6. Only after live staging verification: wire Cloudflare Worker GET endpoint to this function, preserving its existing admin verification.
7. Enqueue/approval/execution remain disabled.

## Status
Not yet configured: dedicated DB role, password/secret, live staging read. Do not report the queue as connected until a real authenticated response succeeds.
