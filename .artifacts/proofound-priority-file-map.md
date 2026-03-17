# Proofound Priority File Map

Generated: 2026-03-16  
Workspace: `/Users/yuriibakurov/proofound`

## Purpose

This is the planning companion to the implementation-status snapshot.
It narrows the repo to the files most worth bringing back into context for the next Codex execution blocks.

## How To Use This Map

- Start with the `Tier 1` files when the next task touches launch truth, verification, reveal, decisions, or public trust.
- Pull in `Tier 2` files when the task touches privacy, authz, or launch evidence.
- Use `Tier 3` files when the next task is about route-surface reduction, legacy drift, or runtime proof gaps.

## Tier 1: First Files To Load

### Launch truth

- `src/app/api/monitoring/launch-status/route.ts`  
  Primary readiness truth endpoint and summary assembler.
- `src/lib/launch/synthetic-monitors.ts`  
  Determines how persisted monitor rows and smoke artifacts become launch state.
- `src/lib/launch/smoke-artifact.ts`  
  Defines smoke artifact schema and freshness logic.
- `.artifacts/launch-smoke-report.json`  
  Last-known runtime evidence and current freshness problem.

### Verification corridor

- `src/app/api/verify/[token]/route.ts`  
  Current canonical token responder and the strongest contradiction to the older mixed-transport audit claim.
- `src/app/api/verify/custom/[token]/route.ts`  
  Custom bundle token responder.
- `src/app/api/verification/requests/skill/route.ts`  
  Canonical skill verification request creation.
- `src/app/api/verification/requests/custom/route.ts`  
  Canonical custom bundle request creation.
- `src/lib/verification/canonical-requests.ts`  
  Core canonical request persistence and token lookup.
- `src/lib/verification/canonical-impact-requests.ts`  
  Canonical impact-story request persistence and lookup.
- `src/lib/verification/canonical-bundles.ts`  
  Canonical custom verification bundle transport.
- `src/app/api/verification/status/route.ts`  
  Best place to inspect remaining legacy and canonical mixing.

### Org corridor

- `src/app/api/org/[id]/shortlist/route.ts`  
  Privacy-safe shortlist surface.
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`  
  Core org review, shortlist, and intro corridor.
- `src/app/api/conversations/[conversationId]/reveal/route.ts`  
  Reveal-with-consent runtime gate.
- `src/app/api/interviews/schedule/route.ts`  
  Interview scheduling corridor.
- `src/app/api/decisions/route.ts`  
  Canonical decision route including `hire`.
- `src/lib/workflow/service.ts`  
  Central lifecycle and reveal progression logic.
- `src/lib/engagement-verifications/service.ts`  
  Distinct engagement-verification corridor after hire.

### Public trust surfaces

- `src/app/portfolio/org/[slug]/page.tsx`  
  Public org trust page and strongest launch-ready public surface.
- `src/app/portfolio/[handle]/page.tsx`  
  Public individual portfolio page.
- `src/lib/portfolio/public-projection.ts`  
  Public-safe portfolio projection and redaction.
- `src/lib/portfolio/public-organization.ts`  
  Narrow public org field resolver.

## Tier 2: High-Value Supporting Files

### Launch support and gates

- `src/lib/launch/contracts.ts`  
  Launch monitor and smoke contract definitions.
- `src/lib/launch/public-org-trust-fixture.ts`  
  Seeded trust fixture that backs the public org trust page.
- `scripts/launch-smoke-runner.ts`  
  Writes the smoke artifact that readiness depends on.
- `scripts/go-no-go-check.ts`  
  Runbook-aligned launch gate enforcement.

### Privacy and uploads

- `src/lib/uploads/privacy.ts`  
  Filename and metadata privacy review rules.
- `src/lib/uploads/lifecycle.ts`  
  Upload state machine, quarantine path, and retained filename fields.
- `src/app/api/upload/document/route.ts`  
  Main document upload path.
- `src/lib/email/privacy.ts`  
  Blind-safe verification email builder.
- `src/lib/email/notifications.ts`  
  Wider workflow email payload builder worth checking for leakage.
- `src/lib/privacy/effective-visibility.ts`  
  Visibility ceiling resolver for public exposure.

### Auth and role semantics

- `src/lib/authz/policy.ts`  
  Canonical TypeScript policy matrix.
- `src/lib/authz/membership.ts`  
  Legacy role normalization and transition logic.
- `src/lib/api/auth.ts`  
  Active membership lookup and backend authorization boundary.
- `src/actions/org.ts`  
  Server actions enforcing owner, manager, reviewer roles.

### Tests and evidence

- `src/app/api/monitoring/__tests__/launch-status-route.test.ts`  
  Most direct test for launch-status behavior.
- `tests/lib/canonical-verification-request-token-resolution.test.ts`  
  Strongest proof that `/api/verify/[token]` is canonical-only now.
- `tests/api/conversation-reveal-route.test.ts`  
  Current reveal route coverage.
- `tests/lib/engagement-verifications.test.ts`  
  Proof that hire and engagement verification are distinct.
- `tests/lib/uploads-privacy.test.ts`  
  Repo proof for upload privacy review behavior.
- `tests/ui/public-org-portfolio-page.test.tsx`  
  Repo proof for public org trust rendering.
- `e2e/public-org-trust.smoke.spec.ts`  
  Live-smoke-backed trust page evidence.
- `e2e/strict/org-corridor.strict.spec.ts`  
  High-value failing smoke for the authenticated org corridor.

## Tier 3: Drift, Compatibility, And Legacy Risk Files

### Legacy drift in route surface

- `src/app/api/match/decision/route.ts`  
  Legacy accept/decline semantics still compiled alongside canonical decisions.
- `src/app/api/conversations/route.ts`  
  Broader conversation compatibility surface beyond the narrow reveal path.
- `src/app/api/organizations/[orgId]/team/route.ts`  
  Active API still exposing legacy role semantics.
- `src/app/api/contracts/route.ts`  
  Clearly broad non-MVP family still compiled.
- `src/app/api/projects/route.ts`  
  Clearly broad non-MVP family still compiled.
- `src/app/api/expertise/profile/route.ts`  
  Large active non-narrow expertise family.
- `src/app/api/skill-gaps/route.ts`  
  Extra dashboard-like family still compiled.
- `src/app/api/integrations/route.ts`  
  Broad integrations family still active.

### Schema and policy truth

- `src/db/schema.ts`  
  Persistence truth, including retained legacy verification structures and role enums.
- `src/db/policies.sql`  
  Checked-in policy truth with legacy-role drift.
- `src/db/migrations/20260310153000_add_canonical_principal_membership_visibility.sql`  
  Canonicalizing migration for principal and membership semantics.

### Remaining verification compatibility

- `src/lib/verification/status-contract.ts`  
  Merges legacy profile signals with canonical verification records.
- `src/app/api/verification/work-email/send/route.ts`  
  Work-email verification channel.
- `src/app/api/verification/work-email/verify/route.ts`  
  Work-email verify callback.
- `src/app/api/verification/linkedin/initiate/route.ts`  
  LinkedIn-based verification initiation compatibility path.

### Runtime-proof gaps

- `tests/privacy/rls-policies.test.ts`  
  Needed to validate actual DB-side privacy posture.
- `tests/privacy/rls-policies-extended.test.ts`  
  Additional DB/RLS proof for canonical role semantics.
- `e2e/helpers/strict-fixtures.ts`  
  Strict smoke fixture builder and likely key to reproducing org corridor failures.

## Suggested Loading Order By Next Task Type

### If the next block is about launch status truth

1. `src/app/api/monitoring/launch-status/route.ts`
2. `src/lib/launch/synthetic-monitors.ts`
3. `src/lib/launch/smoke-artifact.ts`
4. `.artifacts/launch-smoke-report.json`
5. `scripts/launch-smoke-runner.ts`
6. `scripts/go-no-go-check.ts`

### If the next block is about verification transport

1. `src/app/api/verify/[token]/route.ts`
2. `src/lib/verification/canonical-requests.ts`
3. `src/lib/verification/canonical-impact-requests.ts`
4. `src/app/api/verification/requests/skill/route.ts`
5. `src/app/api/verification/status/route.ts`
6. `src/lib/verification/status-contract.ts`
7. `src/db/schema.ts`

### If the next block is about org review, reveal, or hire

1. `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
2. `src/app/api/org/[id]/shortlist/route.ts`
3. `src/app/api/conversations/[conversationId]/reveal/route.ts`
4. `src/lib/workflow/service.ts`
5. `src/app/api/interviews/schedule/route.ts`
6. `src/app/api/decisions/route.ts`
7. `src/lib/engagement-verifications/service.ts`
8. `e2e/strict/org-corridor.strict.spec.ts`

### If the next block is about privacy and public trust

1. `src/app/portfolio/org/[slug]/page.tsx`
2. `src/app/portfolio/[handle]/page.tsx`
3. `src/lib/portfolio/public-projection.ts`
4. `src/lib/privacy/effective-visibility.ts`
5. `src/lib/uploads/privacy.ts`
6. `src/lib/uploads/lifecycle.ts`
7. `src/lib/email/privacy.ts`

## Companion Artifacts

- `/.artifacts/proofound-implementation-status-snapshot.md`
- `/.artifacts/proofound-route-inventory.md`
