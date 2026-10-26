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
