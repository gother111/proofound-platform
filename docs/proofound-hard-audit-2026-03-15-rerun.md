# Proofound Hard Audit Rerun 2026-03-15: Current System vs Locked MVP

Date: 2026-03-15

> Superseded note added 2026-03-25:
> - This file is preserved as historical evidence only and does not override the locked MVP stack or newer `.artifacts/*` current-state evidence.
> - Stale categories in or around this rerun: mixed live verification transport conclusions, any `PageNotFoundError: /_document` build-blocker claims, any `pilot-launchable` or similar launch verdict treated as current truth, and older route-surface claims where newer route inventory disagrees.
> - Current repo truth differs: `npm run build` and `npm run typecheck` now pass under Node `20.20.0`, fresh strict org-corridor evidence is not green today, and route breadth remains an open launch risk.

Audit basis:

- Current checked-out workspace, including modified and untracked files
- Local runtime behavior from the dev server
- Locked MVP authority, in this precedence order:
  1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
  2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
  3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
  4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
  5. `Proofound_Project_Specification_2026-03-11.md`

Rules applied:

- No credit for TODOs, placeholders, mocks, dead code, or commented-out code.
- No credit for schema-only capability without a usable product corridor.
- No credit for UI-only behavior if backend enforcement is missing.
- Feature-flagged, archived, or deleted functionality counts as not launched.
- If behavior was not rerun or not reachable in the local environment, it is labeled `UNVERIFIED`.

## 1. Executive verdict

The current system is narrower and cleaner than the 2026-03-14 rerun, but it is not fully aligned with the locked MVP and is not cleanly launch-ready today.

Estimated alignment: 84%.

Launch judgment: only partially launchable.

What changed since the 2026-03-14 rerun:

- The launch surface is materially narrower. `src/app/api/mobile/**` and `src/app/api/wellbeing/**` are gone from the active tree, and most `src/app/api/admin/**` endpoints are gone.
- Verification request loading is more canonical. `src/lib/verification/request-feed.ts` now pulls canonical skill and impact requests first.
- Repo verification hygiene improved. `npm run typecheck` now passes.

What still prevents a fully aligned, clean launch verdict:

- Launch readiness regressed. `GET /api/monitoring/launch-status` now returns `ok:false`, `readinessState:"blocked"`, and a stale persisted `api_health` monitor failure.
- Verification transport is still mixed end to end. Canonical request storage exists, but response and token routes still fall back to legacy request tables.
- Authenticated org review, reveal, and public org trust runtime behavior were not fully rerun end to end in this pass.

## 2. Top 10 findings

1. `P0 | PARTIALLY_IMPLEMENTED` Launch ops are now the main blocker.
   - Code evidence:
     - `src/app/api/monitoring/launch-status/route.ts`
     - `src/lib/launch/synthetic-monitors.ts`
     - `src/lib/launch/contracts.ts`
   - Behavior evidence:
     - `GET /api/monitoring/launch-status` returned `ok:false`, `readinessState:"blocked"`, `source:"persisted"`, `p1Failures:1`
     - failing monitor: `api_health`
     - failure class: `stale_monitor_result`

2. `P1 | PARTIALLY_IMPLEMENTED` Verification request transport is still mixed.
   - Code evidence:
     - `src/lib/verification/request-feed.ts`
     - `src/lib/verification/canonical-impact-requests.ts`
     - `src/app/api/verify/[token]/route.ts`
     - `src/app/api/expertise/verification/[requestId]/respond/route.ts`
     - `src/app/api/expertise/verifications/custom/request/route.ts`
   - Canonical request loading is real.
   - Legacy `skill_verification_requests` and `impact_story_verification_requests` are still active dependencies in request, token, and response flows.

3. `P1 | PARTIALLY_IMPLEMENTED` Verification is narrower than before, but not fully claim-scoped end to end.
   - Code evidence:
     - `src/lib/verification/status-contract.ts`
     - `src/app/api/verification/status/route.ts`
     - `src/components/settings/VerificationStatus.tsx`
   - Top-level legacy trust-tier output is gone.
   - Work email and LinkedIn remain account-side compatibility channels.

4. `P2 | ALIGNED_IMPLEMENTED` Proof Pack anchor enforcement remains real.
   - Code evidence:
     - `src/db/schema.ts`
     - `src/lib/proofs/pack-anchor.ts`
     - `src/db/migrations/20260313210500_harden_proof_pack_anchor_contract.sql`
   - `proof_packs.primary_subject_type` and `proof_packs.primary_subject_id` remain structurally enforced.

5. `P2 | ALIGNED_IMPLEMENTED` Public summary and public export privacy gating remain fixed.
   - Code evidence:
     - `src/app/api/portfolio/public/[handle]/summary/route.ts`
     - `src/app/api/portfolio/public/[handle]/export/route.ts`
   - Behavior evidence:
     - hidden handle summary returned `404`
     - hidden handle export returned `404`

6. `P2 | ALIGNED_IMPLEMENTED` Proof-first onboarding remains the active individual corridor.
   - Code evidence:
     - `src/components/onboarding/IndividualSetup.tsx`
     - `src/actions/onboarding.ts`
     - `src/lib/readiness/individual-state.ts`
   - Behavior evidence:
     - `tests/ui/individual-setup-proof-first.test.tsx` passed

7. `P2 | ALIGNED_IMPLEMENTED` Engagement verification remains distinct from hire and is still normalized.
   - Code evidence:
     - `src/lib/engagement-verifications/service.ts`
     - `src/app/api/engagement-verifications/[id]/route.ts`
     - `src/lib/workflow/service.ts`

8. `P2 | PARTIALLY_IMPLEMENTED` Scope drift is materially reduced, but not fully removed.
   - Code evidence:
     - remaining internal-only routes in `src/app/api/admin/**`
     - archival classification in `src/lib/launch/surface-policy.ts`
     - archive enforcement in `src/middleware.ts`
   - `mobile` and `wellbeing` are gone from the active API surface.
   - A small internal admin launch-ops surface still exists.

9. `P2 | PARTIALLY_IMPLEMENTED` Org corridor semantics are cleaner, but end-to-end runtime evidence is incomplete.
   - Code evidence:
     - `src/actions/org.ts`
     - `src/app/accept-invite/page.tsx`
     - `src/app/api/decisions/route.ts`
     - `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
     - `src/app/api/interviews/complete/route.ts`
     - `src/app/app/o/[slug]/home/page.tsx`
     - `src/app/app/o/[slug]/interviews/page.tsx`
   - Role language is canonical in active UI and policy paths.
   - Public org trust route runtime was not reachable in the local seed.

10. `P2 | ALIGNED_IMPLEMENTED` Repo verification hygiene improved since the prior rerun.
    - Behavior evidence:
      - `npm run typecheck` now passes
      - `npm run lint` passes with only two image warnings
      - `npm run docs:freshness` still warns about orphan docs

## 3. Source-of-truth alignment table

| Requirement / rule                          | Expected behavior from source of truth                                                        | Current implementation evidence                                                                                                                                                                                                | Status                  | Severity | Notes                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- | -------- | -------------------------------------------------------------------------------------------- |
| MVP scope is narrow                         | No ATS, HRIS, marketplace, org-suite, fairness, wellbeing, or dashboard sprawl in launch flow | `src/lib/launch/surface-policy.ts`, `src/middleware.ts`, deletion of `src/app/api/mobile/**`, deletion of `src/app/api/wellbeing/**`, small remaining internal-only `src/app/api/admin/**` set                                 | `PARTIALLY_IMPLEMENTED` | `P2`     | Active launch surface is narrower; internal admin ops surface remains                        |
| Individual corridor starts with first proof | “Add your first proof” is the real first user corridor                                        | `src/components/onboarding/IndividualSetup.tsx`, `src/actions/onboarding.ts`, `src/lib/readiness/individual-state.ts`, `tests/ui/individual-setup-proof-first.test.tsx`                                                        | `ALIGNED_IMPLEMENTED`   | `P2`     | Still aligned                                                                                |
| Proof Pack is canonical proof object        | Public, review, and export surfaces resolve through Proof Packs                               | canonical pack writes in `src/actions/onboarding.ts`, anchor enforcement in `src/db/schema.ts`, canonical request feed in `src/lib/verification/request-feed.ts`, legacy request fallback still present in verification routes | `PARTIALLY_IMPLEMENTED` | `P1`     | Canonical proof is primary, not yet exclusive                                                |
| Every Proof Pack has one anchor             | No orphan packs, enforced structurally                                                        | `src/db/schema.ts`, `src/lib/proofs/pack-anchor.ts`, `src/db/migrations/20260313210500_harden_proof_pack_anchor_contract.sql`                                                                                                  | `ALIGNED_IMPLEMENTED`   | `P2`     | Still aligned                                                                                |
| Skills are subordinate to proof/context     | No unsupported floating skills in launch corridor                                             | proof-first onboarding and readiness are aligned; expertise verification routes still preserve older skill-request semantics under `src/app/api/expertise/**`                                                                  | `PARTIALLY_IMPLEMENTED` | `P1`     | Launch path is better than legacy transport layer                                            |
| Verification is claim-scoped and narrow     | No inflated trust shortcut from work email or LinkedIn                                        | `src/lib/verification/status-contract.ts`, `src/app/api/verification/status/route.ts`, `src/components/settings/VerificationStatus.tsx`                                                                                        | `PARTIALLY_IMPLEMENTED` | `P1`     | Public trust inflation is gone; account-side compatibility signaling remains                 |
| Privacy and reveal are enforced in code     | Blind review, progressive reveal, public separate from matching reveal                        | `src/lib/privacy/effective-visibility.ts`, `src/lib/matching/review-contract.ts`, public summary/export routes, hidden-handle runtime `404` checks                                                                             | `PARTIALLY_IMPLEMENTED` | `P1`     | Public enforcement is verified; authenticated reveal not rerun end to end                    |
| Org roles are canonical                     | `org_owner`, `org_manager`, `org_reviewer` are primary                                        | `src/lib/authz/policy.ts`, `src/lib/api/auth.ts`, `src/app/app/o/[slug]/home/page.tsx`, `src/actions/org.ts`                                                                                                                   | `PARTIALLY_IMPLEMENTED` | `P1`     | Canonical roles are primary; compatibility normalization from legacy role names still exists |
| Hire and engagement are distinct            | Hire is not engagement verification                                                           | `src/lib/engagement-verifications/service.ts`, `src/app/api/engagement-verifications/[id]/route.ts`, `src/lib/workflow/service.ts`                                                                                             | `ALIGNED_IMPLEMENTED`   | `P2`     | Distinct and still covered by tests                                                          |
| Launch ops satisfy the runbook              | Fresh monitors, fresh smoke evidence, safe runtime state                                      | `src/app/api/monitoring/launch-status/route.ts`, `src/lib/launch/synthetic-monitors.ts`, `.artifacts/launch-smoke-report.json`, runtime blocked persisted status                                                               | `PARTIALLY_IMPLEMENTED` | `P0`     | This regressed since the previous rerun                                                      |

## 4. Area-by-area audit

### A. Product definition and scope

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- Non-MVP individual route pages remain archived with `notFound()`:
  - `src/app/app/i/zen/page.tsx`
  - `src/app/app/i/settings/fairness/page.tsx`
  - `src/app/app/i/expertise/page.tsx`
  - `src/app/app/o/[slug]/analytics/fairness/page.tsx`
- Launch-surface policy is explicit:
  - `src/lib/launch/surface-policy.ts`
- Middleware enforces archived API paths:
  - `src/middleware.ts`

Partially implemented:

- `src/app/api/mobile/**` and `src/app/api/wellbeing/**` are removed from active code, which is a real scope cleanup.
- A small internal-only admin API family remains:
  - `src/app/api/admin/audit/route.ts`
  - `src/app/api/admin/moderation/queue/route.ts`
  - `src/app/api/admin/moderation/action/route.ts`

Legacy drift:

- Legacy role compatibility still exists in policy code:
  - `src/lib/authz/policy.ts`

### B. Individual corridor

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- The active individual setup corridor remains proof-first:
  - `src/components/onboarding/IndividualSetup.tsx`
  - `src/actions/onboarding.ts`
- Readiness still points to proof-backed progress:
  - `src/lib/readiness/individual-state.ts`
- Public summary/export privacy gating remains fixed.

Behavior evidence:

- `tests/ui/individual-setup-proof-first.test.tsx` passed
- hidden public summary/export checks returned `404`

Residual caution:

- Legacy profile/expertise systems still exist in the repo, but the active onboarding corridor is aligned.

### C. Proof system

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Proof Pack anchor enforcement remains real:
  - `src/db/schema.ts`
  - `src/lib/proofs/pack-anchor.ts`
  - `src/db/migrations/20260313210500_harden_proof_pack_anchor_contract.sql`
- Public portfolio summary/export enforcement remains correct.

Partially implemented:

- Canonical verification feed is real:
  - `src/lib/verification/request-feed.ts`
- Verification token and response flows still retain legacy transport dependencies:
  - `src/app/api/verify/[token]/route.ts`
  - `src/app/api/expertise/verification/[requestId]/respond/route.ts`
  - `src/app/api/expertise/verifications/custom/request/route.ts`

What is fixed since the 2026-03-14 rerun:

- No new Proof Pack anchor regression was found.
- Anchor enforcement remains structurally hardened.

### D. Skills logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The launch corridor no longer depends on self-claimed skills alone.

Partially implemented:

- Older skill request semantics still survive in expertise verification routes:
  - `src/app/api/expertise/user-skills/[id]/verification-request/route.ts`
  - `src/app/api/expertise/verifications/incoming/route.ts`
  - `src/app/api/expertise/verifications/custom/[requestId]/route.ts`

Unverified:

- Interpersonal/universal skill handling remains unverified as a separate bounded model in this pass.

### E. Verification logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Verification status contract remains channel-based:
  - `src/lib/verification/status-contract.ts`
  - `src/app/api/verification/status/route.ts`
- UI copy bounds work email and LinkedIn to account-side compatibility:
  - `src/components/settings/VerificationStatus.tsx`
- Canonical impact verification request storage is real:
  - `src/lib/verification/canonical-impact-requests.ts`
  - `src/db/migrations/20260314100000_backfill_canonical_verification_request_transport.sql`

Partially implemented:

- Canonical request transport is primary in the feed, but not exclusive.
- `/api/verify/[token]` still supports both canonical and legacy request paths.
- Expertise verification routes still read or write legacy request tables.

What is fixed since the 2026-03-14 rerun:

- The feed is materially more canonical.

Still unresolved:

- End-to-end verification transport is still mixed.

### F. Privacy and reveal

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Narrowest-wins and review-contract logic remain present:
  - `src/lib/privacy/effective-visibility.ts`
  - `src/lib/matching/review-contract.ts`
- Hidden public profiles still return `404` on summary/export routes.

Behavior evidence:

- `GET /api/portfolio/public/nenah-impact/summary` returned `404`
- `HEAD /api/portfolio/public/nenah-impact/export` returned `404`

Unverified:

- Authenticated progressive reveal behavior was not rerun end to end in the live browser.

### G. Organization corridor

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Canonical launch roles are the active org language:
  - `src/app/app/o/[slug]/home/page.tsx`
  - `src/actions/org.ts`
  - `src/lib/authz/policy.ts`
- Invite acceptance is active:
  - `src/app/accept-invite/page.tsx`
- Interview completion and review/decision routes remain active:
  - `src/app/api/interviews/complete/route.ts`
  - `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
  - `src/app/api/decisions/route.ts`

Partially implemented:

- Policy still normalizes legacy role values:
  - `src/lib/authz/policy.ts`
- Public org trust page runtime behavior was not reachable on a seeded slug in this pass.

Behavior evidence:

- `tests/actions/org-invitations.test.ts` passed
- `tests/api/interviews-complete-route.test.ts` passed
- `tests/ui/organization-interviews-page-actions.test.tsx` passed

### H. Hiring / engagement logic

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- Engagement verification remains distinct from hire:
  - `src/lib/engagement-verifications/service.ts`
  - `src/lib/workflow/service.ts`
  - `src/app/api/engagement-verifications/[id]/route.ts`

Behavior evidence:

- `tests/lib/engagement-verifications.test.ts` passed
- `tests/lib/launch-engagement-verification-smoke.test.ts` passed

### I. Matching and explanation

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Review and reveal logic remains implemented:
  - `src/lib/matching/review-contract.ts`
  - `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- Workflow decision record coverage remains present:
  - `tests/lib/workflow-decision-record.test.ts`

Partially implemented:

- Full authenticated explainability flow was not rerun in the browser.
- This area still depends on code-and-test evidence more than runtime evidence in this pass.

### J. Launch operations and safety

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P0`

Fully implemented and aligned:

- Launch-surface policy and archive enforcement exist and are tested:
  - `src/lib/launch/__tests__/surface-policy.test.ts`
  - `src/lib/__tests__/middleware-launch-archive.test.ts`
- Smoke suites still pass:
  - `tests/lib/launch-hardening-contract.test.ts`
  - `tests/lib/launch-synthetic-monitors.test.ts`
  - `tests/lib/launch-assignment-publish-smoke.test.ts`
  - `tests/lib/launch-engagement-verification-smoke.test.ts`

Not aligned:

- Live launch readiness is blocked:
  - `GET /api/monitoring/launch-status` returned `ok:false`
  - the response source is `persisted`
  - the failing endpoint monitor is stale, not green

Newly introduced regression since the 2026-03-14 rerun:

- Launch status moved from ready to blocked.

## 5. Contradictions and legacy drift

Implemented but should be removed or archived:

- Remaining internal-only admin launch surfaces under `src/app/api/admin/**` if they are not required for pilot ops.
- Legacy verification request transport in:
  - `src/app/api/verify/[token]/route.ts`
  - `src/app/api/expertise/verification/[requestId]/respond/route.ts`
  - `src/app/api/expertise/verifications/**`

Documented but not fully verified in runtime:

- Public org trust page behavior. Code exists, but the local seeded runtime did not expose a reachable org slug for verification.

Old semantics still present:

- Role normalization from legacy values to canonical values in `src/lib/authz/policy.ts`
- Skill-request semantics preserved in expertise verification endpoints

Hidden scope creep that has improved but not vanished:

- Internal admin ops routes still exist even after the larger deletion sweep.

## 6. Launch blockers

Real blockers only:

- `GET /api/monitoring/launch-status` currently reports blocked readiness due to a stale persisted `api_health` monitor result.
- Verification request transport is still mixed enough that the canonical verification corridor is not yet exclusive.

## 7. Recommended fix order

1. Fix launch-status so it reflects fresh monitor state and returns ready when monitors are actually green.
2. Finish the verification transport cutover by removing legacy request-table dependencies from token and response flows.
3. Decide whether the remaining admin launch-ops routes are truly required for pilot ops. Archive the ones that are not.
4. Add one reliable seeded org public trust slug or fixture so org public runtime behavior can be audited directly.

What can wait:

- The remaining lint warnings for raw `<img>` tags.
- Docs freshness orphan warnings unless they are actively causing confusion.

What should be deleted instead of fixed:

- Legacy expertise verification endpoints that exist only to preserve old transport semantics after canonical parity is complete.

## 8. Final audit judgment

What is truly implemented:

- Proof-first onboarding
- Public portfolio privacy gating for summary/export
- Proof Pack anchor enforcement
- Distinct engagement verification workflow
- Canonical role language in active org UI and policy code
- Launch-surface archive policy and middleware enforcement
- Repo typecheck hygiene is fixed

What is partially implemented:

- Canonical verification corridor
- Narrow claim-scoped verification semantics
- Org corridor runtime verification
- Matching/reveal runtime verification
- Launch operations readiness

What is not implemented or not verified cleanly:

- Fully canonical end-to-end verification transport without legacy table fallback
- Rerun-backed public org trust page behavior in the seeded local runtime
- Full authenticated org review and reveal runtime verification in this pass

What contradicts the source of truth:

- Live launch readiness is blocked even though the product corridor itself is narrower and cleaner.
- Legacy verification request transport remains active after canonical migration work.

What should be archived or removed:

- Remaining legacy verification request-table dependencies
- Any internal admin route that is not genuinely required for pilot launch operations

## 9. Fixed since the 2026-03-14 rerun

- `src/app/api/mobile/**` is gone from the active API tree.
- `src/app/api/wellbeing/**` is gone from the active API tree.
- Most of `src/app/api/admin/**` is gone.
- `src/lib/verification/request-feed.ts` is more canonical and now loads canonical skill and impact requests first.
- `npm run typecheck` now passes.

## 10. Still unresolved

- Verification token and response routes still depend on legacy request tables.
- Authenticated org review and reveal flows were not rerun end to end in the local runtime.
- Public org trust runtime remains unverified because a live local slug was not reachable.

## 11. Newly introduced regressions

- `GET /api/monitoring/launch-status` now returns a blocked persisted state because `api_health` is stale. This is a real launch-ops regression relative to the 2026-03-14 rerun.

## 12. Verification results

Runtime checks:

- `npm run dev`
  - `PASS`
- `curl --max-time 25 -sS http://localhost:3000/api/health`
  - `PASS`
  - returned healthy database-connected status
- `curl --max-time 25 -sS http://localhost:3000/api/monitoring/launch-status`
  - `FAIL`
  - returned `ok:false`, `readinessState:"blocked"`, `source:"persisted"`
- `curl --max-time 90 -sS http://localhost:3000/api/monitoring/launch-status`
  - `FAIL`
  - same blocked persisted result, not a short-timeout artifact
- `curl --max-time 25 -i -sS http://localhost:3000/api/portfolio/public/nenah-impact/summary`
  - `PASS`
  - returned `404`
- `curl --max-time 25 -I -sS http://localhost:3000/api/portfolio/public/nenah-impact/export`
  - `PASS`
  - returned `404`
- `curl --max-time 25 -i -sS http://localhost:3000/api/portfolio/public/sofia-martinez/summary`
  - `PASS`
  - returned `200`
- `curl --max-time 25 -i -sS http://localhost:3000/portfolio/org/proofound-labs`
  - `UNVERIFIED`
  - returned `404`, so org public trust runtime could not be confirmed

Focused tests:

- `npm run test -- tests/ui/public-portfolio-access-consistency.test.tsx tests/ui/individual-setup-proof-first.test.tsx tests/lib/engagement-verifications.test.ts tests/lib/human-attestations.test.ts tests/ui/archived-mvp-routes.test.ts tests/lib/portfolio-text-pack.test.ts tests/lib/launch-hardening-contract.test.ts tests/lib/launch-synthetic-monitors.test.ts tests/lib/launch-assignment-publish-smoke.test.ts tests/lib/launch-engagement-verification-smoke.test.ts src/app/api/monitoring/__tests__/launch-status-route.test.ts tests/api/verification-status-route.test.ts tests/api/mobile-verification-status-route.test.ts tests/lib/proof-pack-anchor.test.ts tests/lib/verification-policy.test.ts tests/ui/verification-status-options.test.tsx tests/ui/verifications-page.test.tsx tests/actions/org-invitations.test.ts tests/api/interviews-complete-route.test.ts tests/api/conversation-reveal-route.test.ts tests/lib/workflow-decision-record.test.ts tests/ui/organization-interviews-page-actions.test.tsx`
  - `PASS`
  - 22 files, 77 tests passed
- `npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/api/decisions-route.test.ts tests/api/org-match-review-route.test.ts tests/api/match-interest-route.test.ts`
  - `PASS`
  - 6 files, 26 tests passed

Repo verification:

- `npm run lint`
  - `PASS`
  - 0 errors, 2 warnings for raw `<img>` tags
- `npm run typecheck`
  - `PASS`
- `npm run docs:freshness`
  - `PASS_WITH_WARNINGS`
  - orphan-doc warnings remain for older audit and report files
