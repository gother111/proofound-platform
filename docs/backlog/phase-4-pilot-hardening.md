> Doc Class: `active`
> Last Verified: `2026-03-25`

# Phase 4: Pilot Hardening and Launch Ops

Execution crosswalk: authoritative MVP `Phase 4 — Pilot hardening`.

Current status: `PLANNED`, gated behind Phase 3.

Phase goal: refresh operational evidence and prove the launch runbook gates with the narrowed corridor, not with stale smoke or archived route assumptions.

| Task ID | Task | Owner | Depends On | Launch Blocking | Exit Criteria | Evidence / Verification |
| --- | --- | --- | --- | --- | --- | --- |
| `P4-1` | Refresh backup, restore, smoke, monitor, and go or no-go evidence using the runbook’s exact launch gates after the corridor and perf work have stabilized. | Platform + Ops | `Phase 3 PASS` | `Yes` | Backups, restore verification, smoke, monitors, and go or no-go evidence are all fresh and green against the current narrowed corridor. | Run `npm run db:backup:checkpoint`; `npm run db:restore:verify -- --checkpoint <dir>`; `npm run test:launch:smoke`; `npm run monitor:launch`; and `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go` with a fresh smoke artifact and current required evidence files. |
| `P4-2` | Verify the internal-only launch ops surfaces and manual queues: verification queue, trust disputes, revocations, workflow comms, and pilot operations ownership. | Ops + Product | `P4-1` | `Yes` | Internal-only admin surfaces stay narrow, staffed, and documented, and manual queue ownership is explicit for launch. | Use [`../internal-ops/verification-review-sop.md`](../internal-ops/verification-review-sop.md), [`../internal-ops/reveal-privacy-dispute-sop.md`](../internal-ops/reveal-privacy-dispute-sop.md), [`../internal-ops/engagement-verification-evidence-checklist.md`](../internal-ops/engagement-verification-evidence-checklist.md), [`../internal-ops/assignment-quality-checklist.md`](../internal-ops/assignment-quality-checklist.md), [`../internal-ops/workflow-comms-templates.md`](../internal-ops/workflow-comms-templates.md), [`../../src/app/api/admin/internal-ops/queues/route.ts`](../../src/app/api/admin/internal-ops/queues/route.ts), [`../../src/app/api/admin/internal-ops/queues/[id]/route.ts`](../../src/app/api/admin/internal-ops/queues/[id]/route.ts), and [`../../src/lib/launch/surface-policy.ts`](../../src/lib/launch/surface-policy.ts). |
| `P4-3` | Resolve active-doc drift only for launch-relevant docs and registries so launch truth, runbook truth, and evidence indexes all agree on the current narrowed corridor. | Docs + Platform | `P4-1` | `Yes` | No active doc contradicts the latest launch truth. Historical docs may remain only when clearly marked as non-authoritative evidence. | Run `npm run docs:freshness`, then reconcile [`../verification-checklist.md`](../verification-checklist.md), [`../launch-operations-mvp.md`](../launch-operations-mvp.md), [`../DOCS_REGISTRY.md`](../DOCS_REGISTRY.md), and the fresh `.artifacts/` launch files. |

Phase notes:

- Phase 4 is where the runbook becomes current proof again. Do not reuse older “green” claims if the underlying artifact or monitor is stale.
- Internal-only launch ops are part of the MVP operating model, but they must remain narrow and manually owned.
