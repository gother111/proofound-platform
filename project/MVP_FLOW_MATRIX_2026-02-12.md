> Doc Class: `historical`
> Last Verified: `2026-05-19`

# Historical MVP Flow Matrix - 2026-02-12

This file preserves the February 12, 2026 strict-flow matrix as historical launch evidence. Do not
use it as current MVP flow truth, current strict-gate truth, current provider policy, or current
launch readiness.

The current MVP flow authority is:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. fresh repo-grounded evidence

Current evidence surfaces:

- `docs/verification-checklist.md`
- `docs/mvp-launch-master-checklist.md`
- `docs/testing-strategy.md`
- `agent/checklists/verification.md`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`

## Historical Snapshot

On February 12, 2026 this matrix tracked an I-01..I-20 and O-01..O-20 strict-flow pass/fail
snapshot. It also recorded a provider-gate failure under an older policy that treated connected
provider state as launch-blocking by default.

That provider policy is superseded. The locked MVP interview posture is manual-link first.
Connected-provider E2E is target-scoped and should be required only when
`STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true` for a target that intentionally includes connected
provider behavior.

## Current Use

Use this file only to understand the old February strict-flow audit shape. Before citing flow
completion or launch readiness now, collect fresh evidence for the intended target, including:

- proof-first onboarding and Proof Pack anchor integrity
- bounded verification semantics
- blind-by-default review and candidate-consented reveal
- assignment create/edit/review/publish
- review, intro, reveal, manual-link interview, decision, hire, and engagement verification
- export/delete and auditability
- route-surface and archived-route policy
- Browser desktop/mobile evidence where UI behavior changed
- target-specific backup, restore, launch-status, perf-status, and final go/no-go evidence
