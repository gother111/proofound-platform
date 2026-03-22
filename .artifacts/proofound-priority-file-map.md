# Proofound Priority File Map

Generated: 2026-03-21  
Workspace: `/Users/yuriibakurov/proofound`

## Purpose

This map narrows the repo to the files most worth loading first for the current launch-truth and hardening state.

## Tier 1: Start Here

### Launch truth

- `scripts/launch-smoke-runner.ts`
  - Writes the current smoke artifact and is the fastest way to understand launch evidence.
- `.artifacts/launch-smoke-report.json`
  - Fresh corridor evidence from this run.
- `src/app/api/monitoring/launch-status/route.ts`
  - Readiness endpoint that consumes smoke freshness and persisted monitor state.
- `scripts/go-no-go-check.ts`
  - Defines the repo’s final launch gate expectations.

### Org corridor

- `e2e/strict/org-corridor.strict.spec.ts`
  - Launch-binding end-to-end org corridor.
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
  - Blind review and shortlist mutation boundary.
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
  - Progressive reveal with consent.
- `src/app/api/decisions/route.ts`
  - Canonical decision route.
- `src/lib/workflow/service.ts`
  - Shared workflow transitions, including decision progression.
- `src/lib/engagement-verifications/service.ts`
  - Separate post-hire engagement verification lifecycle.

### Public org trust

- `scripts/seed-public-org-trust-fixture.ts`
  - Seeds the canonical trust card fixture.
- `e2e/public-org-trust.smoke.spec.ts`
  - Smoke contract for the public org trust card.
- `src/lib/launch/public-org-trust-fixture.ts`
  - Canonical fixture payload.
- `src/app/portfolio/org/[slug]/page.tsx`
  - Public organization trust page.
- `src/lib/portfolio/public-projection.ts`
  - Public-safe organization projection shaping.

## Tier 2: High-Value Supporting Files

### Compatibility and runtime hardening

- `src/lib/internal-ops/queue.ts`
  - Now contains the schema-compatibility fallback that stopped missing queue tables from breaking the org corridor.
- `tests/lib/internal-ops-queue.test.ts`
  - Regression coverage for queue fallback behavior.
- `tests/lib/engagement-verifications.test.ts`
  - Unit coverage around post-hire engagement verification.
- `tests/api/decisions-route.test.ts`
  - Canonical decision route coverage.

### Onboarding and public privacy

- `src/components/onboarding/IndividualSetup.tsx`
  - Current proof-first staged onboarding UI.
- `tests/ui/individual-setup-proof-first.test.tsx`
  - Updated to the current onboarding surface.
- `tests/ui/public-portfolio-access-consistency.test.tsx`
  - Public individual portfolio privacy contract.
- `tests/ui/public-org-portfolio-page.test.tsx`
  - Public org trust rendering contract.
- `tests/privacy/rls-policies.test.ts`
  - Core privacy/RLS suite.
- `tests/privacy/rls-policies-extended.test.ts`
  - Extended conversation/reveal RLS coverage.

## Tier 3: Remaining Risk And Scope Files

### Route breadth

- `.artifacts/proofound-route-inventory.md`
  - Current route-surface summary and counts.
- `src/lib/launch/surface-policy.ts`
  - Explicit launch-surface gate and archive policy.
- `tests/api/launch-surface-inventory.test.ts`
  - Route-surface contract test.

### Runtime environment drift

- `src/app/api/interviews/complete/route.ts`
  - Current best-effort feedback invite handling when hosted PostgREST schema cache lags.
- `src/lib/feedback/service.ts`
  - Feedback token issuance path that still surfaces hosted schema-cache warnings.
- `src/app/api/admin/verification/linkedin/queue/route.ts`
  - Admin queue surface that depends on internal ops queue persistence being available in the runtime database.

### Homepage reference

- `src/app/page.tsx`
  - Homepage route metadata and JSON-LD.
- `src/components/ProofoundLanding.tsx`
  - Current landing page composition and header navigation.
- `docs/landing-page-master-reference.md`
  - Current implementation reference for the homepage.
