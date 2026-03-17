# Proofound Hard Audit Rerun 2026-03-16: Current System vs Locked MVP

Date: 2026-03-16

Update note, later same worktree:

- The route-surface pruning continued after this rerun was written.
- The current workspace has since deleted the previously cited non-MVP route handlers under `src/app/api/analytics/**`, `src/app/api/dashboard/**`, `src/app/api/momentum/**`, `src/app/api/organizations/[orgId]/{culture,impact,projects,structure,evidence-pack}/**`, and `src/app/api/org/[id]/dashboard`.
- The current workspace has also deleted the archived legacy verification handlers under `src/app/api/expertise/**/verification*`, `src/app/api/expertise/verifications/**`, and `src/app/api/verification/skill/{request,respond}`.
- The current workspace also archives `GET /api/org/[id]/coverage` as non-MVP analytics and removes its implementation.
- As a result, statements below that describe those route files as still compiled and reachable are stale and should be read as rerun-time findings, not current workspace truth.

Audit basis:

- Current checked-out workspace, including modified and untracked files
- Local runtime behavior from the dev server
- Locked MVP authority, in this precedence order:
  1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
  2. `PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md`
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

The current system improved in several important areas since the 2026-03-15 rerun, but the locked MVP is still not cleanly aligned.

Estimated alignment: 78%.

Launch judgment: only partially launchable.

What improved since the 2026-03-15 rerun:

- The seeded public org trust page is now verifiably live and minimal.
- Verification request creation and response routes under `src/app/api/verification/requests/**` are now canonical-first.
- Upload privacy handling now includes explicit filename and metadata review logic.
- Admin moderation endpoints are gone from the active API tree.
- `npm run build` now passes locally.

What keeps the system out of a clean locked-MVP verdict:

- `GET /api/monitoring/launch-status` is still blocked and now fails more broadly because persisted endpoint checks and smoke evidence are stale.
- The compiled route surface remains materially broader than the locked MVP. Analytics, dashboard, org-suite, fairness, momentum, and other non-MVP APIs are still shipped and reachable behind auth.
- Verification transport is cleaner but not exclusive. `/api/verify/[token]` still supports mixed legacy and canonical request paths.

## 2. Top 10 findings

1. `P0 | PARTIALLY_IMPLEMENTED` Launch-status is currently a real launch blocker.
   - Code evidence:
     - `src/app/api/monitoring/launch-status/route.ts`
     - `src/lib/launch/synthetic-monitors.ts`
   - Behavior evidence:
     - `GET /api/monitoring/launch-status` returned `503`
     - `ok:false`
     - `readinessState:"blocked"`
     - `summary.p1Failures:6`
     - `summary.p2Failures:4`
   - The blocker is not a user-flow bug. It is stale persisted endpoint evidence plus stale smoke artifact evidence.

2. `P1 | CONTRADICTS_SOURCE_OF_TRUTH` The active compiled route surface is still wider than the locked MVP.
   - Code evidence:
     - `src/app/api/analytics/fairness/route.ts`
     - `src/app/api/dashboard/layout/route.ts`
     - `src/app/api/momentum/summary/route.ts`
     - `src/app/api/organizations/[orgId]/culture/route.ts`
     - `src/app/api/organizations/[orgId]/impact/route.ts`
     - `src/app/api/organizations/[orgId]/projects/route.ts`
     - `src/app/api/organizations/[orgId]/structure/route.ts`
   - Behavior evidence:
     - `HEAD /api/analytics/fairness` returned `401`, not `410`
     - `npm run build` route inventory still includes these families as active routes

3. `P1 | PARTIALLY_IMPLEMENTED` Verification transport is now canonical-first in active request routes, but still mixed end to end.
   - Code evidence:
     - `src/app/api/verification/requests/skill/route.ts`
     - `src/app/api/verification/requests/skill/[requestId]/respond/route.ts`
     - `src/app/api/verification/requests/custom/route.ts`
     - `src/app/api/verify/[token]/route.ts`
   - Canonical request creation and response routes are real.
   - The token review route still supports legacy request-table paths.

4. `P2 | ALIGNED_IMPLEMENTED` Public org trust is now a verified, live MVP surface.
   - Code evidence:
     - `src/lib/launch/public-org-trust-fixture.ts`
     - `src/app/portfolio/org/[slug]/page.tsx`
   - Behavior evidence:
     - `GET /portfolio/org/proofound-labs` returned `200`
     - `tests/ui/public-org-portfolio-page.test.tsx` passed

5. `P2 | ALIGNED_IMPLEMENTED` Legacy verification entrypoints now fail shut instead of lingering as soft drift.
   - Code evidence:
     - `src/lib/launch/surface-policy.ts`
     - `src/middleware.ts`
   - Behavior evidence:
     - `GET /api/verification/skill/request` returned `410`
     - `GET /api/admin/moderation/queue` returned `410`

6. `P2 | ALIGNED_IMPLEMENTED` Proof-first onboarding remains aligned.
   - Code evidence:
     - `src/components/onboarding/IndividualSetup.tsx`
     - `src/actions/onboarding.ts`
     - `src/lib/readiness/individual-state.ts`
   - Behavior evidence:
     - `tests/ui/individual-setup-proof-first.test.tsx` passed

7. `P2 | ALIGNED_IMPLEMENTED` Public summary/export gating remains fixed.
   - Code evidence:
     - `src/app/api/portfolio/public/[handle]/summary/route.ts`
     - `src/app/api/portfolio/public/[handle]/export/route.ts`
   - Behavior evidence:
     - hidden handle summary returned `404`
     - hidden handle export returned `404`

8. `P2 | ALIGNED_IMPLEMENTED` Upload privacy review is now explicitly implemented.
   - Code evidence:
     - `src/lib/uploads/privacy.ts`
     - `src/app/api/upload/document/route.ts`
     - `src/lib/email/privacy.ts`
   - Tests:
     - `tests/api/upload-document-route.test.ts`
     - `tests/lib/uploads-privacy.test.ts`
     - `tests/lib/workflow-email-privacy.test.ts`

9. `P2 | ALIGNED_IMPLEMENTED` Proof Pack anchor enforcement remains real.
   - Code evidence:
     - `src/db/schema.ts`
     - `src/lib/proofs/pack-anchor.ts`
   - Tests:
     - `tests/lib/proof-pack-anchor.test.ts`
     - `tests/lib/canonical-proof-pack-projection.test.ts`

10. `P3 | PARTIALLY_IMPLEMENTED` Repo verification is cleaner, but docs freshness and route hygiene still lag.
    - Behavior evidence:
      - `npm run lint` passed with 2 warnings
      - `npm run typecheck` passed
      - `npm run build` passed
      - `npm run docs:freshness` reported 22 orphan-doc warnings

## 3. Source-of-truth alignment table

| Requirement / rule                          | Expected behavior from source of truth                                                               | Current implementation evidence                                                                                                                                                                                                           | Status                        | Severity | Notes                                                                             |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- | --------------------------------------------------------------------------------- |
| MVP scope is narrow                         | No ATS, HRIS, org-suite, fairness, dashboard, marketplace, or wellbeing sprawl in active launch flow | active compiled API families in `src/app/api/analytics/**`, `src/app/api/dashboard/**`, `src/app/api/organizations/[orgId]/{culture,impact,projects,structure}/**`, `src/app/api/momentum/**`; runtime `401` on `/api/analytics/fairness` | `CONTRADICTS_SOURCE_OF_TRUTH` | `P1`     | Deletions helped, but the live compiled surface is still broad                    |
| Individual corridor starts with first proof | “Add your first proof” is the real onboarding path                                                   | `src/components/onboarding/IndividualSetup.tsx`, `src/actions/onboarding.ts`, `tests/ui/individual-setup-proof-first.test.tsx`                                                                                                            | `ALIGNED_IMPLEMENTED`         | `P2`     | Still aligned                                                                     |
| Proof Pack is canonical proof object        | Proof-backed surfaces resolve through Proof Packs                                                    | canonical routes and pack enforcement exist; `/api/verify/[token]` still mixes canonical and legacy paths                                                                                                                                 | `PARTIALLY_IMPLEMENTED`       | `P1`     | Stronger than before, not exclusive                                               |
| Every Proof Pack has one anchor             | No orphan packs are structurally possible                                                            | `src/db/schema.ts`, `src/lib/proofs/pack-anchor.ts`, `tests/lib/proof-pack-anchor.test.ts`                                                                                                                                                | `ALIGNED_IMPLEMENTED`         | `P2`     | Still aligned                                                                     |
| Skills are subordinate to proof/context     | No floating unsupported skills in launch corridor                                                    | proof-first onboarding is aligned; older expertise verification semantics still exist in archived or compatibility routes                                                                                                                 | `PARTIALLY_IMPLEMENTED`       | `P1`     | Better than earlier reruns                                                        |
| Verification is claim-scoped and narrow     | No inflated public trust shortcut from work email or LinkedIn                                        | `src/lib/verification/status-contract.ts`, `src/app/api/verification/status/route.ts`, `src/components/settings/VerificationStatus.tsx`                                                                                                   | `PARTIALLY_IMPLEMENTED`       | `P1`     | Bounded in UI/API, but legacy profile fields still feed the contract              |
| Privacy and reveal are enforced in code     | Blind review, progressive reveal, public separate from matching reveal                               | public summary/export `404` checks, `src/lib/privacy/effective-visibility.ts`, `src/lib/matching/review-contract.ts`, upload privacy review                                                                                               | `PARTIALLY_IMPLEMENTED`       | `P1`     | Public and upload privacy are verified; authenticated reveal not rerun end to end |
| Org roles are canonical                     | `org_owner`, `org_manager`, `org_reviewer` are primary                                               | `src/lib/authz/policy.ts`, `src/lib/api/auth.ts`, `src/actions/org.ts`, `src/app/app/o/[slug]/home/page.tsx`                                                                                                                              | `PARTIALLY_IMPLEMENTED`       | `P1`     | Canonical roles are primary, legacy normalization still exists                    |
| Hire and engagement are distinct            | Hire is not engagement verification                                                                  | `src/lib/engagement-verifications/service.ts`, `src/lib/workflow/service.ts`, tests still pass                                                                                                                                            | `ALIGNED_IMPLEMENTED`         | `P2`     | Still aligned                                                                     |
| Launch ops satisfy the runbook              | Fresh monitors, fresh smoke evidence, safe runtime state                                             | `src/app/api/monitoring/launch-status/route.ts`, `src/lib/launch/contracts.ts`, runtime blocked/stale monitor evidence                                                                                                                    | `PARTIALLY_IMPLEMENTED`       | `P0`     | This remains a blocker                                                            |

## 4. Area-by-area audit

### A. Product definition and scope

Status: `CONTRADICTS_SOURCE_OF_TRUTH`  
Severity: `P1`

Fully implemented and aligned:

- `src/app/api/mobile/**` is absent from the active tree.
- `src/app/api/wellbeing/**` is absent from the active tree.
- Admin moderation endpoints are removed from the active tree.
- Legacy verification entrypoints are explicitly archived through middleware.

Contradictions:

- The compiled API surface still includes major non-MVP families:
  - `src/app/api/analytics/**`
  - `src/app/api/dashboard/**`
  - `src/app/api/momentum/**`
  - `src/app/api/organizations/[orgId]/{culture,impact,projects,structure}/**`
- `HEAD /api/analytics/fairness` returned `401`, which means the route is active, not archived.

Legacy drift:

- App pages still exist for out-of-scope themes, even if some are likely gated or archived:
  - `src/app/app/i/zen/page.tsx`
  - `src/app/app/i/settings/fairness/page.tsx`
  - `src/app/app/o/[slug]/analytics/fairness/page.tsx`

### B. Individual corridor

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- Proof-first onboarding remains the active path.
- Public portfolio summary/export privacy gating remains fixed.

Behavior evidence:

- `tests/ui/individual-setup-proof-first.test.tsx` passed
- hidden summary returned `404`
- hidden export returned `404`

### C. Proof system

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Proof Pack anchor enforcement remains real.
- Canonical proof-pack projections are tested.

Partially implemented:

- Request creation and response routes under `src/app/api/verification/requests/**` are canonical-first.
- `/api/verify/[token]` still contains mixed legacy and canonical resolution/update logic.

Tests:

- `tests/lib/proof-pack-anchor.test.ts`
- `tests/lib/canonical-proof-pack-projection.test.ts`
- `tests/lib/canonical-verification-request-token-resolution.test.ts`

### D. Skills logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The launch corridor no longer depends on free-floating skills alone.

Partially implemented:

- Skills still surface through compatibility and archived expertise routes.
- The current repo still preserves older expertise semantics and route families for compatibility.

Evidence:

- `src/app/api/expertise/user-skills/[id]/proofs/route.ts`
- `src/app/api/expertise/user-skills/[id]/verification-request/route.ts`
- `src/app/api/expertise/verifications/**`

### E. Verification logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- `VerificationStatusContract` remains channel-based.
- Public trust inflation is bounded in the current UI contract.
- Canonical bundle infrastructure now exists for custom verification requests.
- Legacy `/api/verification/skill/request` is archived to `410`.

Partially implemented:

- The active request creation/respond stack is canonical.
- `/api/verify/[token]` is still mixed and keeps legacy request-table compatibility alive.

Evidence:

- `src/lib/verification/status-contract.ts`
- `src/app/api/verification/status/route.ts`
- `src/components/settings/VerificationStatus.tsx`
- `src/lib/verification/canonical-bundles.ts`
- `src/app/api/verification/requests/skill/route.ts`
- `src/app/api/verification/requests/skill/[requestId]/respond/route.ts`
- `src/app/api/verify/[token]/route.ts`

### F. Privacy and reveal

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Public portfolio hidden-handle protection remains correct.
- Upload filename and metadata privacy review are now explicit.
- Blind-safe verification email copy is implemented.

Evidence:

- `src/app/api/portfolio/public/[handle]/summary/route.ts`
- `src/app/api/portfolio/public/[handle]/export/route.ts`
- `src/lib/uploads/privacy.ts`
- `src/app/api/upload/document/route.ts`
- `src/lib/email/privacy.ts`

Unverified:

- Full authenticated reveal progression was not rerun end to end in the browser.

### G. Organization corridor

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The public org trust card is now live, minimal, and privacy-safe.
- Invite, review, reveal, interview completion, and decision routes still pass focused tests.
- Canonical org roles remain the active role language in UI and auth helpers.

Evidence:

- `src/app/portfolio/org/[slug]/page.tsx`
- `src/lib/launch/public-org-trust-fixture.ts`
- `src/actions/org.ts`
- `src/app/accept-invite/page.tsx`
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `src/app/api/interviews/complete/route.ts`
- `src/app/api/decisions/route.ts`

Partially implemented:

- Legacy role normalization still exists in policy code.
- Broader org-suite APIs remain compiled and active behind auth.

### H. Hiring / engagement logic

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- Engagement verification remains distinct from hire.
- Workflow decision and engagement tests still pass.

Evidence:

- `src/lib/engagement-verifications/service.ts`
- `src/lib/workflow/service.ts`
- `tests/lib/engagement-verifications.test.ts`
- `tests/lib/workflow-decision-record.test.ts`

### I. Matching and explanation

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Review and reveal API routes still pass focused tests.

Evidence:

- `src/app/api/conversations/[conversationId]/reveal/route.ts`
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `tests/api/conversation-reveal-route.test.ts`
- `tests/api/org-match-review-route.test.ts`

Unverified:

- Full authenticated explanation and shortlist review flow was not rerun in-browser in this pass.

### J. Launch operations and safety

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P0`

Fully implemented and aligned:

- Launch contracts and monitor definitions exist.
- Build and test coverage around launch hardening still pass.

Evidence:

- `src/lib/launch/contracts.ts`
- `src/lib/launch/synthetic-monitors.ts`
- `tests/lib/launch-hardening-contract.test.ts`
- `tests/lib/launch-synthetic-monitors.test.ts`
- `src/app/api/monitoring/__tests__/launch-status-route.test.ts`

Not aligned:

- Runtime launch-status is still blocked.
- The current status is entirely driven by stale persisted endpoint evidence plus stale smoke artifact evidence.
- The route only attempts live HTTP refresh when the persisted state is otherwise refresh-eligible. That means stale smoke evidence can hold the route in blocked state even while live endpoints are healthy.

## 5. Contradictions and legacy drift

Implemented but should be removed or archived:

- Active non-MVP route families under:
  - `src/app/api/analytics/**`
  - `src/app/api/dashboard/**`
  - `src/app/api/momentum/**`
  - `src/app/api/organizations/[orgId]/{culture,impact,projects,structure}/**`

Documented but not fully verified in runtime:

- Full authenticated reveal corridor
- Full authenticated org review/explanation corridor

Old semantics still present:

- Legacy role normalization in `src/lib/authz/policy.ts`
- Mixed token-resolution support in `src/app/api/verify/[token]/route.ts`

Hidden scope creep:

- The build output still contains a wider launch surface than the locked MVP narrative allows.

## 6. Launch blockers

Real blockers only:

- `GET /api/monitoring/launch-status` currently returns blocked readiness because persisted endpoint and smoke evidence are stale.

## 7. Recommended fix order

1. Fix launch-status so stale smoke artifacts and stale monitor rows do not keep readiness blocked when fresh live checks are available.
2. Finish removing mixed legacy transport from `/api/verify/[token]`.
3. Archive or remove active non-MVP API families that are still compiled and reachable behind auth.
4. Keep the new public org trust fixture wired into smoke coverage so this corridor stays directly auditable.

What can wait:

- Raw `<img>` lint warnings
- Docs freshness orphan warnings

What should be deleted instead of fixed:

- Any remaining compatibility route that exists only to preserve legacy verification request-table transport after canonical parity is complete.

## 8. Final audit judgment

What is truly implemented:

- Proof-first onboarding
- Public portfolio privacy gating
- Public org trust card
- Upload privacy review
- Canonical request creation and response routes
- Proof Pack anchor enforcement
- Distinct engagement verification workflow
- Buildable local app

What is partially implemented:

- End-to-end canonical verification transport
- Claim-scoped verification semantics
- Authenticated reveal and org review runtime validation
- Launch readiness and monitor freshness

What is not implemented or not verified cleanly:

- A clean narrow route surface consistent with the locked MVP
- Full browser-rerun coverage for authenticated org review/explanation flows

What contradicts the source of truth:

- Active non-MVP API families are still shipped in the compiled product.
- Launch readiness is blocked and stale.

What should be archived or removed:

- Broad analytics, dashboard, momentum, and org-suite API families outside the locked MVP
- Remaining mixed legacy verification token transport

## 9. Fixed since the 2026-03-15 rerun

- Public org trust moved from `UNVERIFIED` to verified live behavior.
- Admin moderation endpoints are no longer present in the active tree.
- Canonical verification request creation and response routes are now active under `/api/verification/requests/**`.
- Upload privacy review is now explicit and tested.
- `npm run build` now passes locally.

## 10. Still unresolved

- Launch-status remains blocked.
- The compiled product surface is still wider than the locked MVP.
- `/api/verify/[token]` still supports mixed legacy and canonical request transport.
- Legacy role normalization remains in policy code.

## 11. Newly introduced regressions

- Launch-status deterioration is broader than the prior rerun. The current blocked state now includes stale smoke-artifact failures across synthetic monitors, not just stale endpoint monitor rows.

## 12. Verification results

Runtime checks:

- `npm run dev`
  - `PASS`
- `curl --max-time 25 -sS http://localhost:3000/api/health`
  - `PASS`
- `curl --max-time 25 -sS http://localhost:3000/api/monitoring/launch-status`
  - `FAIL`
  - `503`, blocked, stale persisted evidence
- `curl --max-time 90 -sS http://localhost:3000/api/monitoring/launch-status`
  - `FAIL`
  - same blocked result
- `curl --max-time 25 -i -sS http://localhost:3000/api/portfolio/public/nenah-impact/summary`
  - `PASS`
  - `404`
- `curl --max-time 25 -I -sS http://localhost:3000/api/portfolio/public/nenah-impact/export`
  - `PASS`
  - `404`
- `curl --max-time 25 -i -sS http://localhost:3000/api/portfolio/public/sofia-martinez/summary`
  - `PASS`
  - `200`
- `curl --max-time 25 -i -sS http://localhost:3000/portfolio/org/proofound-labs`
  - `PASS`
  - `200`
- `curl --max-time 25 -i -sS http://localhost:3000/api/verification/skill/request`
  - `PASS`
  - `410`, archived legacy verification route
- `curl --max-time 25 -i -sS http://localhost:3000/api/admin/moderation/queue`
  - `PASS`
  - `410`, archived admin route
- `curl --max-time 25 -I -sS http://localhost:3000/app/i/zen`
  - `PASS`
  - `307` redirect to `/login`
- `curl --max-time 25 -I -sS http://localhost:3000/api/analytics/fairness`
  - `PASS`
  - `401`, active auth-gated non-MVP route

Focused tests:

- `npm run test -- tests/ui/public-portfolio-access-consistency.test.tsx tests/ui/individual-setup-proof-first.test.tsx tests/lib/engagement-verifications.test.ts tests/lib/human-attestations.test.ts tests/ui/archived-mvp-routes.test.ts tests/lib/portfolio-text-pack.test.ts tests/lib/launch-hardening-contract.test.ts tests/lib/launch-synthetic-monitors.test.ts tests/lib/launch-assignment-publish-smoke.test.ts tests/lib/launch-engagement-verification-smoke.test.ts src/app/api/monitoring/__tests__/launch-status-route.test.ts tests/api/verification-status-route.test.ts tests/api/mobile-verification-status-route.test.ts tests/lib/proof-pack-anchor.test.ts tests/lib/verification-policy.test.ts tests/ui/verification-status-options.test.tsx tests/ui/verifications-page.test.tsx tests/api/custom-verification-routes.test.ts tests/lib/canonical-verification-request-token-resolution.test.ts`
  - `PASS`
  - 19 files, 80 tests passed
- `npm run test -- tests/actions/org-invitations.test.ts tests/api/interviews-complete-route.test.ts tests/api/conversation-reveal-route.test.ts tests/lib/workflow-decision-record.test.ts tests/ui/organization-interviews-page-actions.test.tsx tests/api/decisions-route.test.ts tests/api/org-match-review-route.test.ts tests/api/match-interest-route.test.ts tests/ui/public-org-portfolio-page.test.tsx tests/api/admin-organizations-verify-route.test.ts tests/lib/workflow-email-privacy.test.ts tests/lib/workflow-reveal-timeout.test.ts`
  - `PASS`
  - 12 files, 39 tests passed
- `npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx tests/api/upload-document-route.test.ts tests/api/upload-status-route.test.ts tests/lib/uploads-privacy.test.ts tests/lib/canonical-proof-pack-projection.test.ts tests/api/expertise-user-skill-proofs-route.test.ts tests/api/expertise-skill-verification-request-route.test.ts tests/api/expertise-verification-respond-route.test.ts tests/api/expertise-verifications-custom-route.test.ts tests/api/expertise-verifications-sent-delete-route.test.ts tests/ui/add-skill-drawer-proof-verification.test.tsx tests/ui/edit-skill-window-proofs.test.tsx`
  - `PASS`
  - 14 files, 60 tests passed

Repo verification:

- `npm run lint`
  - `PASS`
  - 0 errors, 2 warnings
- `npm run typecheck`
  - `PASS`
- `npm run build`
  - `PASS`
  - prebuild readiness warned about missing deployment env vars
- `npm run docs:freshness`
  - `PASS_WITH_WARNINGS`
  - 22 orphan-doc warnings
