# View-counter rollout checklist

Status: **NOT ACTIVATED**. The existing browser-side counter remains in use until an explicitly approved production migration and Worker secrets are ready.

## Already verified
- Cloudflare Worker route `POST /api/listing-view` is guarded by `VIEW_COUNT_ENABLED === 'true'`.
- Request, origin, body, IP digest and upstream failure behavior are covered by tests.
- Staging RPC `public.vexorio_record_listing_view_server(bigint,text)` is executable by `service_role`.
- Staging rejects missing listings and invalid visitor digests.
- Staging has no test listing; positive deduplication test is still pending.

## Required manual configuration in Cloudflare Workers
The following are **Worker environment secrets**, not frontend JavaScript values or public GitHub files:
- `VIEW_COUNT_SECRET`: random high-entropy secret used for HMAC-SHA256 of the visitor IP.
- `SUPABASE_SERVICE_ROLE_KEY`: the server-only service role key for the selected Supabase environment.
- `SUPABASE_URL`: exact HTTPS URL for that same Supabase project.
- `VIEW_COUNT_ENABLED`: keep unset/false until all verification is complete.

Do not paste secrets into ChatGPT, issue trackers, commit messages, or public files. Set them through the Cloudflare dashboard: Workers & Pages → the VEXORIO Worker → Settings → Variables and Secrets. Use the encrypted/secret option for credentials. A later deploy must preserve these bindings.

## Remaining acceptance criteria
1. Create a dedicated **staging-only** test account and approved listing through supported app flows (no production user data copied).
2. Test the guarded staging RPC: first unique visitor increments once, repeat does not, second visitor increments once.
3. Confirm Worker secrets and target environment without exposing their values.
4. Obtain explicit approval before applying the guard migration to production Supabase.
5. Switch frontend from the legacy `record_listing_view` RPC to the Worker endpoint only after the new production RPC is deployed, secrets exist, and a rollback plan is verified.
6. Verify the live counter and remove old public execution permission only after successful cutover.

Do not mark this task complete until the production cutover has passed.
