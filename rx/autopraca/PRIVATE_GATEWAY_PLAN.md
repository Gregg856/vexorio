# RX AUTOPRACA 2.1 — private queue gateway

## Verified staging state (2026-10-28)
- Project: `owkjdlpawczrnwyszduj` only.
- `rx_private.ant_task_queue` exists with RLS enabled.
- SQL check: `anon`, `authenticated`, **and `service_role`** have no USAGE on `rx_private`.
- PostgREST exposure of `rx_private` is not confirmed. Do not add it to exposed schemas.
- The Worker `GET /api/rx/ants/tasks` is intentionally fail-closed (503), not a live integration.

## Recommended gateway
1. Create a dedicated Supabase Edge Function on **staging** with JWT verification enabled. The Worker must forward the logged-in admin's Supabase access token, not a user ID from the browser.
2. In the function, verify the JWT using Supabase Auth `getUser`, and verify membership through existing `public.is_vexorio_admin` under the caller's JWT. Reject anonymous/non-admin users.
3. Access `rx_private.ant_task_queue` via a **server-side Postgres connection** with tightly scoped DB privileges. Keep DB credentials in Supabase function secrets, never browser JavaScript. Do not expose the private schema through PostgREST.
4. Start with read-only list (max 20). Then implement allowlisted enqueue (always `pending_approval`), approval (admin action), event audit, and only later an explicitly approved executor.
5. Validate `source`, `task_type`, `payload`, request size and UUIDs; use parameterized queries. Enforce a staging project lock and fail closed if any configuration is missing.
6. Add tests for missing/expired JWT, non-admin, bad Origin, production URL, missing DB secret, SQL injection, unexpected payload, concurrent approval, and DB outage.
7. Verify staging end-to-end with one synthetic task, then remove it with an audited cancellation. Never change production without explicit approval.

## Important
Do not solve permission failures by granting `anon`/`authenticated` access to the private schema or by adding a public SECURITY DEFINER RPC. The existing `staging-queue-adapter.cjs` is a contract/mock adapter, **not** a verified live database connection.

## Current status
Design documented; Edge Function and database gateway **not deployed**. No ant tasks are executing.
