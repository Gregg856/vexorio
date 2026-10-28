# RX Cloud — architecture and staging acceptance gate (RX 3.4)

## Agreed architecture
VEXORIO owns the RX application logic, orchestration contracts, Queen UI, ant modules and DNA state definitions. Hosted infrastructure (Supabase, Cloudflare and GitHub) currently supplies managed services; **do not describe the hosting hardware or third-party platform as our own server**. The goal is a portable RX backend with an explicitly controlled migration path to self-hosted infrastructure.

## Verified 2026-10-28
- GitHub `main` contains `rx-queen-cloud.mjs`, `rx-queen-panel.mjs`, and `rx-queen-history-export.mjs`.
- Supabase staging `owkjdlpawczrnwyszduj` has `public.rx_queen_history` with RLS enabled and zero rows at inspection.
- Staging policy names: `rx_queen_history_owner_insert` (INSERT, authenticated), `rx_queen_history_owner_select` (SELECT, authenticated).
- Mock user-isolation contract passed CI #2791. **This is not a live authenticated end-to-end test**.
- The Queen panel is staging-gated; a staging hostname, auth redirect allowlist and test user session still require live verification.

## Next acceptance checks
1. Confirm a dedicated staging hostname and Supabase Auth redirect allowlist without changing production.
2. Use a consenting dedicated test account to sign in to staging.
3. Preview a non-sensitive test report, save it, and reload it by returned UUID.
4. Verify that a separate test account cannot read the first account's report.
5. Inspect database logs and clean up test data using a controlled authorized process.
6. Record results and CI references; only then mark RX cloud history E2E as complete.

## Security guardrails
- Browser: publishable key only; no service-role credentials.
- Preserve production Supabase URL/key and production portal behavior.
- RLS is the authorization boundary; client-side owner filtering is defense in depth.
- Do not enable autonomous execution of Queen proposals from the report UI.
- Review staging security-advisor warnings for SECURITY DEFINER functions separately before any grants or revocations.
