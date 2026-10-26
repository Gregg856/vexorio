# RX DNA BLACK BOX — project continuity

This file is the **versioned, human-readable project handoff**, not a secret vault or an autonomous AI memory. Update it only with verified facts from the repository and CI. Do not put credentials, tokens, user data, or private chat contents here.

## Identity
- Repository: Gregg856/vexorio (main)
- Deployment: Cloudflare Worker `vexorio.grzegorzbub1985.workers.dev`
- Existing RX components: `rx-million-hearts.js`, `rx-dna-core.js`, `guard-rx-queen-panel.js`, `rx-command-bridge.js`
- Supabase environments: production `lfytoxcnutduahshbsko`; staging `owkjdlpawczrnwyszduj`

## Non-negotiable rules
1. Continue the existing project; do not create duplicate websites, accounts or rewrite working sections.
2. Never claim deploy or tests passed without checking GitHub Actions.
3. Publish approved changes through the existing deployment pipeline; preserve the public VEXORIO UI unless explicitly authorized.
4. All production writes, deployments and privilege changes require explicit human approval.
5. Prefer bounded, low-cost, event-driven task handlers; logical ants are not independent AI models.
6. Preserve security: no secrets in client-side code or this file; no unreviewed automatic code execution.
7. Keep the source of truth in versioned files and verified CI, not chat-only recollections.

## Implemented
- `rx-million-hearts.js`: bounded scheduling, virtual ant identities, per-ant verified memory snapshots.
- `rx-dna-core.js`: DNA manifest with restricted permissions, bounded memory backup, checksum for accidental corruption detection. **Checksum is not cryptographic authentication or encryption.**
- `tests/rx-dna-core.cjs`: DNA, backup and checksum tests; included in `.github/workflows/rx-bibi-browser.yml`.
- Existing RX Queen and command bridge remain separate; no autonomous AI or persistent remote DNA storage is claimed.

## Next engineering steps
1. Build a private persistent RX memory store with server-side access control, encryption at rest, retention policy, backups and verified recovery. Start on staging.
2. Connect approved ant memory snapshots to the store. Never trust client-supplied claims that tests passed.
3. Make Queen's approval auditable before any writes/deployments.
4. Add smoke tests for memory restore, authorization denial, rollback and failure recovery.
5. Only then expand safe automatic workflows gradually.

## Working method
- Before each task: inspect actual current code, recent commits and CI; do not redo completed fixes.
- After each change: test, inspect run statuses, report exact commit and pending failures.
- After verified milestone: update this file with factual state and next step.

## RX DNA CLOUD 1.1 — staging milestone (2026-10-26)
- Staging Supabase only (`owkjdlpawczrnwyszduj`): private schema `rx_private` and table `rx_private.ant_memory` created by migration `rx_dna_cloud_private_staging_memory`.
- Columns: `ant_id`, `dna_version`, bounded `snapshot` JSONB (16 KiB), `revision`, `updated_at`.
- RLS enabled; schema/table privileges revoked from `anon` and `authenticated`. Verified access checks returned false.
- Verified server-side SQL round-trip for synthetic ant `RX-000001`; no real user data stored.
- **Not yet connected** to RX handlers, Queen, or browser; no public REST API and no cross-device synchronization claimed.
- Next: build authenticated server-side write/read path with audit trail, optimistic revision control, backup and restore tests on staging. Keep credentials off client.

## RX DNA CLOUD 1.1 — audit and optimistic locking (staging)
- Migration `rx_dna_cloud_audit_and_revision_guard` on staging only: private `rx_private.ant_memory_audit`, audit trigger and `rx_private.write_ant_memory(text,jsonb,bigint)`.
- Version guard: expected revision 0 inserts new memory, otherwise updates only the matching revision; stale writes raise `Ant memory revision conflict`.
- Verified synthetic `RX-000001` revision 1 → 2 and one audit row; stale revision 1 was rejected.
- Verified no `EXECUTE` for `anon`/`authenticated`, no anonymous audit table access.
- **Not yet connected to Queen/browser/Worker**. Requires server-only authenticated gateway and backup/restore tests before automatic ant persistence.

## RX DNA CLOUD 1.1 — server adapter milestone
- Added `rx-dna-store-server.cjs`: dependency-injected server-only store requiring a trusted `authorize(context)` callback for every load/save.
- Validates ant ID, bounded verified-fix references, snapshot shape and optimistic revisions.
- Added `tests/rx-dna-store.cjs` with mocked persistence: authorization denial, round-trip, stale revision conflict and malformed payload rejection.
- CI `rx-bibi-browser.yml` now runs the server adapter tests.
- **Security boundary:** an authorization callback is not itself an identity provider. Do not pass client-controlled booleans as proof of Queen privileges. The test-only `{queen:true}` fixture is NOT production authorization.
- **Integration pending:** actual trusted server identity verification, staging DB connector and Queen UI. No claim of live cloud synchronization yet.

## RX DNA CLOUD 1.2 — HTTPS transport
- Added `rx-dna-cloud-gateway.cjs` and `rx-dna-cloud-transport.cjs` (Node CommonJS): bounded RPC allowlist, HTTPS Supabase URL validation, JWT forwarding and explicit denied-access handling.
- Added mocked transport and gateway contract tests to RX CI.
- Staging SQL gateway functions `public.rx_dna_staging_read` and `public.rx_dna_staging_write` require `auth.uid()` and `public.is_vexorio_admin()`. Anonymous EXECUTE revoked.
- **Still pending:** live authenticated admin round-trip, automated Queen integration, persistence on restart, backup/restore, and end-to-end authorization tests.
- The transport uses public Supabase key + authenticated user JWT, not a service-role key. Never store JWT in repo or test logs.

## RX MONEY ENGINE 1.0 — zero-budget prototype (owner approved)
- Owner approved provisional allocation: 70% of available net funds for RX development, 30% reserve, with explicit approval for any expenditure.
- Added `rx-money-engine.cjs` with six role labels (SCOUT, SALES, TESTER, REPORT, TREASURER, BUILDER), deterministic task status transitions and in-memory income/expense ledger in integer cents.
- Added `tests/rx-money-engine.cjs` to RX CI; checks approval requirement and 70/30 split.
- **Not live:** no customer acquisition, no payments, no financial accounts, no scheduled agents, no persistent ledger, no authenticated owner approval. No mining. This is a local software prototype only.
- Next: persistent append-only staging ledger with authenticated approval, idempotency, bounded scheduling, legal/commercial review and cost controls. No autonomous payments.

## RX EVOLUTION + MONEY RADAR 1.0
- Added `rx-evolution-engine.cjs`: bounded proposal queue, tests/security evaluation flags, human approval before any manual implementation. It does not generate, execute, or deploy code.
- Added `rx-money-radar.cjs`: bounded, deduplicated, research-only opportunity records with estimated revenue and cost; no crawling, outreach, billing or payment.
- Added `tests/rx-evolution-radar.cjs` to RX CI.
- Still pending: verified external leads, persistence in staging, trusted owner authorization, and any background scheduler. Zero autonomous spending.

## RX ANT HIBERNATION 1.0
- `rx-ant-hibernation.cjs`: bounded in-memory logical credit allocation and max concurrent active ants; sleep/wake only, no cloud scheduler or physical energy generation.
- `tests/rx-ant-hibernation.cjs`: credit exhaustion, sleep, max concurrency, invalid ID.
- RX EVOLUTION/RADAR CI failure #125 diagnosed from job logs: passing `structuredClone` directly to `Array.map` caused Node 24 to interpret the array index as options. Fixed in both modules using an explicit callback.
- New CI must be verified before marking changes green. No production DB writes or automatic spending.

## RX GENESIS 1.0 — DIGITAL EVOLUTION
- `rx-genesis.cjs`: bounded in-memory proposals, parent-child inheritance only from approved variants, generation limit, test/security flags, human approval label, deterministic best-score selection.
- `tests/rx-genesis.cjs`: inheritance, selection, capacity, generation and review gates.
- No autonomous code generation, actual measured performance, persistent storage, cryptographically verified test evidence, or automatic deployment. Test/security flags are caller supplied, not independently validated. No production database changes.
- RX BIBI #127, VEXORIO checks #2171, Cloudflare deploy #2333 were successful before this change; Genesis CI must be checked separately.

## RX ANT ACADEMY 1.0
- `rx-ant-academy.cjs`: bounded in-memory reputation and deterministic rank/leaderboard with non-monetary rewards only.
- `tests/rx-ant-academy.cjs`: promotion, invalid metrics, capacity, leaderboard.
- Important: performance metrics are caller-provided, not yet independently verified; priorities are informational, not connected to scheduler. No payments, automatic actions or persistence. Future work: authenticated measured outcomes and durable storage.

## RX ANT ACADEMY 2.0 — proof receipts
- `rx-ant-academy-proof.cjs`: bounded in-memory receipt deduplication, collision detection, passed-only score accounting and leaderboard. `tests/rx-ant-academy-proof.cjs` added to CI.
- Critical trust boundary: `source:'trusted_ci'` is a plain caller-provided string, NOT authentication or a verified CI attestation. This is only a local adapter; it must not be exposed as an untrusted public endpoint or used for automatic production privileges.
- Next: verified GitHub run identity and immutable receipts, durable storage, actual measured performance. No financial rewards or autonomous actions.
