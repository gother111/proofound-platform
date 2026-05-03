# Proofound Priority File Map

Generated: 2026-03-25  
Workspace: `/Users/yuriibakurov/proofound`

## Purpose

This map narrows the repo to the files most worth loading first for the current reality-check and launch-risk state.

## Tier 1: Start Here

### Current-state truth

- `.artifacts/proofound-current-state-reality-check.md`
  - Canonical current-block classification matrix for this refresh.
- `.artifacts/launch-readiness-summary.md`
  - Current top-line launch verdict with stale-claim retirement notes.
- `.artifacts/proofound-route-inventory.md`
  - Fresh route-surface counts, highest-volume families, and route-breadth evidence.
- `docs/verification-checklist.md`
  - Requirement-by-requirement locked-MVP checklist that the current-state matrix maps from.

### Launch-status and smoke truth

- `src/app/api/monitoring/launch-status/route.ts`
  - Readiness endpoint that consumes persisted smoke evidence and live refresh behavior.
- `src/app/api/monitoring/__tests__/launch-status-route.test.ts`
  - Fresh current-block verification that stale smoke evidence blocks readiness.
- `.artifacts/launch-smoke-report.json`
  - Historical persisted smoke artifact. Treat as stale until rerun.
- `scripts/launch-smoke-runner.ts`
  - Artifact writer for future smoke refreshes.

## Tier 2: Corridor And Surface Risk Files

### Review and reveal corridor

- `tests/api/org-match-review-route.test.ts`
  - Fresh current-block route coverage for Stage 2 gating, masked review, shortlist updates, and privacy-safe rejection reasons.
- `tests/api/conversation-reveal-route.test.ts`
  - Fresh current-block route coverage for pending reveal, dual approval, and timeout reset behavior.
- `tests/api/decisions-route.test.ts`
  - Fresh current-block decision route coverage.
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
  - Blind-review mutation boundary.
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
  - Progressive reveal with consent.
- `src/app/api/decisions/route.ts`
  - Canonical decision route.

### Full strict corridor rerun boundary

- `e2e/strict/org-corridor.strict.spec.ts`
  - Launch-binding strict org corridor, but stateful.
- `e2e/helpers/strict-fixtures.ts`
  - Service-role-backed runtime fixture creation and cleanup. Read before deciding whether a live rerun is safe.

### Route breadth

- `src/lib/launch/surface-policy.ts`
  - Explicit launch-surface gate and archive policy.
- `tests/api/launch-surface-inventory.test.ts`
  - Fresh current-block contract showing which routes are still treated as active or archived.

## Tier 3: Supporting Public And Runtime Files

### Public trust and projection

- `scripts/seed-public-org-trust-fixture.ts`
  - Canonical trust-page fixture seed script.
- `e2e/public-org-trust.smoke.spec.ts`
  - Public org trust smoke contract.
- `src/lib/launch/public-org-trust-fixture.ts`
  - Canonical org trust fixture payload.
- `src/app/portfolio/org/[slug]/page.tsx`
  - Public organization trust page.
- `src/lib/portfolio/public-projection.ts`
  - Public-safe projection shaping.

### Runtime drift and compatibility risk

- `src/app/api/interviews/complete/route.ts`
  - Feedback invite completion path.
- `src/lib/feedback/service.ts`
  - Feedback token issuance path, including the recent `token` insert compatibility update in the current branch.
- `src/app/api/admin/verification/linkedin/queue/route.ts`
  - Admin queue surface that still depends on runtime queue persistence.

<!-- final-launch-checklist:start -->

- `.artifacts/launch-validation-YYYY-MM-DD/final-launch-checklist-status.md`
  - Operational Section 12 checklist with evidence-backed PASS / FAIL / BLOCKED / UNVERIFIED rows.
- `.artifacts/launch-validation-YYYY-MM-DD/final-launch-checklist-status.json`
  - Machine-readable bundle for the same checklist run.

Current generated paths: `.artifacts/launch-validation-2026-05-02/final-launch-checklist-status.md`, `.artifacts/launch-validation-2026-05-02/final-launch-checklist-status.json`

<!-- final-launch-checklist:end -->
