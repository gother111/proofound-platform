# Proofound Hard Audit Rerun: Current System vs Locked MVP

Date: 2026-03-12

> Superseded note added 2026-03-25:
> - This file is preserved as historical evidence only and does not override the locked MVP stack or newer `.artifacts/*` current-state evidence.
> - Stale categories in or around this rerun: mixed live verification transport conclusions, any `PageNotFoundError: /_document` build-blocker claims, any `pilot-launchable` or similar launch verdict treated as current truth, and older route-surface claims where newer route inventory disagrees.
> - Current repo truth differs: `npm run build` and `npm run typecheck` now pass under Node `20.20.0`, fresh strict org-corridor evidence is not green today, and route breadth remains an open launch risk.

Audit basis:

- Repository code and current checked-out workspace, including uncommitted changes
- Local runtime behavior from the dev server
- Source-of-truth documents in this precedence order:
  1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
  2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
  3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
  4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
  5. `Proofound_Project_Specification_2026-03-11.md`

Rules applied:

- No credit for TODOs, placeholders, mocks, or dead code.
- No credit for UI-only behavior if backend enforcement is missing.
- No credit for backend-only tables if usable flow is missing.
- Feature-flagged or archived functionality is treated as not launched.
- Admin-only or hidden tools count as internal support, not user-facing MVP.
- If behavior could not be verified, it is labeled `UNVERIFIED`.

## 1. Executive verdict

The current system is still not fully aligned with the locked MVP, but it is materially closer than the previous audit.

Estimated alignment: 58%.

Launch judgment: not launchable.

Why it improved:

- The prior public export privacy blocker is fixed.
- The individual onboarding corridor is now substantially proof-first.
- Engagement verification is now a real workflow, not just a schema or doc claim.
- The org trust profile has been narrowed toward the locked MVP.

Why it is still not launchable:

- Launch-status is still red because monitors and smoke artifacts are stale.
- Verification semantics still over-credit work email and LinkedIn compatibility tiers.
- Legacy skill and verification corridors still coexist with the canonical Proof Pack model.
- The schema still permits orphan Proof Packs even though readiness rules try to block them.
- Out-of-scope admin, mobile, wellbeing, analytics, and legacy expertise surfaces remain in the codebase.

Rerun delta versus the earlier audit:

- Resolved: public summary/export no longer bypass public-page availability.
- Resolved: the main onboarding path is no longer profile-first.
- Resolved: engagement verification now exists in code, API, UI, and workflow contracts.
- Improved: public text/PDF export now includes Proof Pack structure.
- Improved: the org trust profile page is narrower and no longer mounts the older broad org-suite empty state.
- Still unresolved: verification tier inflation, schema-level orphan pack allowance, stale launch ops, mixed legacy verification flow, and legacy scope drift.

## 2. Top 10 findings

1. `P0 | PARTIALLY_IMPLEMENTED` Launch operations are still failing the runbook even though the product code improved.
   - Code evidence:
     - `scripts/go-no-go-check.ts`
     - `scripts/launch-smoke-runner.ts`
     - `src/lib/launch/contracts.ts`
   - Behavior evidence:
     - `GET /api/monitoring/launch-status` returned `ok:false`
     - It reported `p1Failures:7` and `p2Failures:5`
     - Failures are stale monitor and stale smoke-artifact failures, not green launch ops
   - Failure type: launch/safety execution gap

2. `P1 | CONTRADICTS_SOURCE_OF_TRUTH` Verification status still inflates work email and LinkedIn into compatibility trust tiers.
   - Code evidence:
     - `src/app/api/verification/status/route.ts`
     - `src/lib/verification/policy.ts`
     - `src/lib/verification/tier.ts`
   - `verificationTier` still returns `unverified | workplace_verified | identity_verified`
   - `effectiveIdentityVerified = policySummary.compatibility.verified` still drives the API response
   - The technical requirements explicitly say LinkedIn import or employment-verification logic is not MVP trust logic
   - Failure type: docs claim unsupported by trust semantics in code

3. `P1 | PARTIALLY_IMPLEMENTED` Proof Pack is much more canonical now, but legacy proof and verification corridors are still live.
   - Code evidence:
     - `src/actions/onboarding.ts`
     - `src/lib/proofs/canonical-pack.ts`
     - `src/app/app/i/verifications/page.tsx`
     - `src/app/api/verify/[token]/route.ts`
     - `src/app/api/expertise/**`
   - Onboarding now creates `proof_artifacts`, `proof_packs`, and `proof_pack_items` directly.
   - The verification corridor still depends on `skill_verification_requests` and `impact_story_verification_requests`.
   - Failure type: code exists but not fully rewired into one canonical product flow

4. `P1 | PARTIALLY_IMPLEMENTED` The individual corridor is now proof-first in onboarding, but legacy profile and expertise corridors still coexist and can pull the product back toward older semantics.
   - Code evidence:
     - `src/components/onboarding/IndividualSetup.tsx`
     - `src/lib/profile/completion-flow.ts`
     - `src/components/profile/GuidedProfileSetupView.tsx`
     - `src/components/profile/EditableProfileView.tsx`
     - `src/app/app/i/expertise/page.tsx`
   - The onboarding corridor is now `safe_shell -> real_context -> first_proof -> proof_pack -> optional_verification -> publish_portfolio`.
   - The repo still contains legacy profile editing and expertise verification systems.
   - Failure type: workflow partially modernized while legacy workflow remains live in code

5. `P1 | PARTIALLY_IMPLEMENTED` Orphan Proof Packs are still structurally possible even though readiness logic forbids them for intro-eligible users.
   - Code evidence:
     - `src/db/schema.ts`
     - `src/lib/readiness/individual-state.ts`
   - `proof_packs.primary_subject_type` and `proof_packs.primary_subject_id` are nullable.
   - Readiness now flags `No orphan Proof Packs`, but the schema itself does not enforce the rule.
   - Failure type: backend integrity enforcement missing

6. `P1 | PARTIALLY_IMPLEMENTED` Engagement verification is now real and distinct from hire, but optional proof issuance after engagement is still not found as a usable corridor.
   - Code evidence:
     - `src/lib/engagement-verifications/service.ts`
     - `src/app/api/engagement-verifications/[id]/route.ts`
     - `src/db/schema.ts`
     - `src/lib/workflow/contracts.ts`
     - `src/app/app/i/interviews/page.tsx`
     - `src/app/app/o/[slug]/interviews/page.tsx`
   - The system now tracks `pending_both_confirmations`, `pending_candidate_confirmation`, `pending_organization_confirmation`, and `verified`.
   - Distinct engagement types are normalized.
   - Optional proof issuance support after verification was not found as a user-facing flow.
   - Failure type: workflow partially implemented

7. `P1 | PARTIALLY_IMPLEMENTED` Human-observed attestation now has real bounded structure, but the live verification system still rides on legacy request tables.
   - Code evidence:
     - `src/lib/verification/human-attestations.ts`
     - `src/app/api/verify/[token]/route.ts`
     - `src/app/api/verify/custom/[token]/route.ts`
     - `src/app/app/i/verifications/page.tsx`
   - Bounded interpersonal skill families, max skill count, structured response schema, and exact-skill matching are implemented.
   - The operational request flow still runs through legacy verification request tables.
   - Failure type: canonical policy implemented on top of legacy transport

8. `P1 | PARTIALLY_IMPLEMENTED` Scope creep is reduced in active UI, but non-MVP admin, mobile, wellbeing, fairness, and older expertise surfaces remain in the repo and some remain live as internal APIs.
   - Code evidence:
     - `src/app/app/i/zen/page.tsx`
     - `src/app/app/i/settings/fairness/page.tsx`
     - `src/app/app/i/expertise/page.tsx`
     - `src/app/app/o/[slug]/analytics/fairness/page.tsx`
     - `tests/ui/archived-mvp-routes.test.ts`
     - `src/app/api/mobile/**`
     - `src/app/api/admin/**`
     - `src/app/api/wellbeing/**`
   - The excluded UI routes now return `notFound()`.
   - The codebase still carries broad non-MVP API and schema surface.
   - Failure type: legacy drift and out-of-scope internal surface

9. `P2 | ALIGNED_IMPLEMENTED` The previous public summary/export privacy leak is fixed.
   - Code evidence:
     - `src/app/api/portfolio/public/[handle]/summary/route.ts`
     - `src/app/api/portfolio/public/[handle]/export/route.ts`
     - `src/lib/portfolio/public-projection.ts`
   - Both routes now call `resolvePublicIndividualPortfolioAccessByHandle(...)` and return `404` unless the profile is accessible.
   - Behavior evidence:
     - `GET /portfolio/nenah-impact` shows unavailable state
     - `GET /api/portfolio/public/nenah-impact/summary` returns `404`
     - `GET /api/portfolio/public/nenah-impact/export` returns `404`
   - This was a prior blocker. It is no longer a blocker.

10. `P2 | PARTIALLY_IMPLEMENTED` Public exports now include Proof Pack structure, but behavior evidence is still limited by available seed data.

- Code evidence:
  - `src/lib/portfolio/text-pack.ts`
  - `src/lib/portfolio/pdf.ts`
  - `src/app/api/portfolio/public/[handle]/export/route.ts`
- Export surfaces now render `Selected proof packs`, verification state, freshness state, outcomes, and selected evidence.
- Behavior evidence:
  - `GET /api/portfolio/public/sofia-martinez/summary` returned `200`
  - The returned text showed zero public proof packs for that seeded profile
- Failure type: behavior only partially verified due available sample data

## 3. Source-of-truth alignment table

| Requirement / rule                          | Expected behavior from source of truth                                                                       | Current implementation evidence                                                                                                                                                                                                                                                                                       | Status                        | Severity | Notes                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- | ----------------------------------------------------------------------------------- |
| MVP scope is narrow                         | No ATS, HRIS, marketplace, org-suite, or dashboard sprawl in launch flow                                     | Archived route pages now `notFound()`: `src/app/app/i/zen/page.tsx`, `src/app/app/i/settings/fairness/page.tsx`, `src/app/app/i/expertise/page.tsx`, `src/app/app/o/[slug]/analytics/fairness/page.tsx`; but broad API surface remains in `src/app/api/mobile/**`, `src/app/api/admin/**`, `src/app/api/wellbeing/**` | `PARTIALLY_IMPLEMENTED`       | `P1`     | Active UI improved, repo surface still broad                                        |
| Individual corridor starts with first proof | `Add your first proof` is the core launch path                                                               | `src/components/onboarding/IndividualSetup.tsx`, `src/lib/profile/completion-flow.ts`, `src/components/profile/GuidedProfileSetupView.tsx`, `src/app/app/i/home/page.tsx`                                                                                                                                             | `PARTIALLY_IMPLEMENTED`       | `P1`     | Onboarding is now aligned, older profile/expertise corridors still exist            |
| Proof Pack is canonical proof object        | User-facing flows should resolve back to Proof Packs                                                         | `src/actions/onboarding.ts`, `src/lib/proofs/canonical-pack.ts`, `src/lib/portfolio/text-pack.ts`, `src/lib/portfolio/pdf.ts`, but verification still uses `src/app/app/i/verifications/page.tsx` and `src/app/api/verify/[token]/route.ts` with legacy request tables                                                | `PARTIALLY_IMPLEMENTED`       | `P1`     | Canonical proof object is much stronger than before, but not exclusive              |
| Every Proof Pack has one primary anchor     | No orphan Proof Packs for intro-eligible users                                                               | `src/db/schema.ts` keeps `primary_subject_type` and `primary_subject_id` nullable; `src/lib/readiness/individual-state.ts` blocks intro eligibility for orphan packs                                                                                                                                                  | `PARTIALLY_IMPLEMENTED`       | `P1`     | Readiness enforces, schema does not                                                 |
| Skills are subordinate to proof/context     | No floating unsupported skills                                                                               | `src/lib/readiness/individual-state.ts` now requires role-relevant skills to resolve back to anchored Proof Packs, but `src/app/api/expertise/**` and `src/app/app/i/expertise/**` still expose legacy standalone skill flows                                                                                         | `PARTIALLY_IMPLEMENTED`       | `P1`     | Better than before, still mixed                                                     |
| Verification is claim-scoped                | LinkedIn and work email must not be inflated into MVP trust logic                                            | `src/app/api/verification/status/route.ts`, `src/lib/verification/policy.ts`, `src/lib/verification/tier.ts`                                                                                                                                                                                                          | `CONTRADICTS_SOURCE_OF_TRUTH` | `P1`     | Compatibility layer still drives visible trust tier output                          |
| Privacy and reveal are enforced in code     | Blind-by-default review, progressive reveal, consented identity reveal, public separate from matching reveal | `src/lib/privacy/effective-visibility.ts`, `src/lib/matching/review-contract.ts`, `src/app/api/portfolio/public/[handle]/summary/route.ts`, `src/app/api/portfolio/public/[handle]/export/route.ts`                                                                                                                   | `PARTIALLY_IMPLEMENTED`       | `P1`     | Public export gate is fixed; authenticated reveal stages not fully runtime-verified |
| Org roles are canonical                     | `org_owner`, `org_manager`, `org_reviewer` with clear permissions                                            | `src/lib/authz/policy.ts`, `src/lib/api/auth.ts`, `src/app/api/engagement-verifications/[id]/route.ts`, `src/app/api/decisions/window/[interviewId]/route.ts`                                                                                                                                                         | `PARTIALLY_IMPLEMENTED`       | `P1`     | Canonical roles are active, but legacy role normalization still exists              |
| Hire and engagement are distinct            | Hire is not engagement verification                                                                          | `src/lib/engagement-verifications/service.ts`, `src/db/schema.ts`, `src/lib/workflow/contracts.ts`, `src/app/app/i/interviews/page.tsx`, `src/app/app/o/[slug]/interviews/page.tsx`                                                                                                                                   | `ALIGNED_IMPLEMENTED`         | `P2`     | Distinct states now exist in storage, API, and UI                                   |
| Launch ops satisfy runbook                  | Smoke, monitor freshness, manual hold states, auditable launch readiness                                     | `scripts/go-no-go-check.ts`, `scripts/launch-smoke-runner.ts`, `src/lib/launch/contracts.ts`, runtime `GET /api/monitoring/launch-status`                                                                                                                                                                             | `PARTIALLY_IMPLEMENTED`       | `P0`     | Tooling is real, current operational state is failing                               |

## 4. Area-by-area audit

### A. Product definition and scope

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Active archived non-MVP route pages now hard-stop with `notFound()`:
  - `src/app/app/i/zen/page.tsx`
  - `src/app/app/i/settings/fairness/page.tsx`
  - `src/app/app/i/expertise/page.tsx`
  - `src/app/app/o/[slug]/analytics/fairness/page.tsx`
- Regression coverage exists:
  - `tests/ui/archived-mvp-routes.test.ts`

Partially implemented:

- The launch-facing UI is narrower than before.
- The repo still contains broad non-MVP internal surfaces:
  - `src/app/api/mobile/**`
  - `src/app/api/admin/**`
  - `src/app/api/wellbeing/**`
  - large older dashboard and org-suite schema segments in `src/db/schema.ts`

Claimed but not actually implemented:

- Full removal of dashboard, admin, wellbeing, expertise, and mobile sprawl from the current system.

Out of scope or contradictory:

- Mobile APIs remain implemented.
- Admin fairness and analytics remain implemented.
- Wellbeing APIs remain implemented.

Legacy drift:

- Older dashboard and org-suite semantics still occupy schema, endpoints, and UI support code even if the main launch routes are archived.

Launch risk:

- Medium to high. The launch UI is narrowing, but the system still carries too much non-MVP surface.

### B. Individual corridor

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The main onboarding corridor is now proof-first:
  - `src/components/onboarding/IndividualSetup.tsx`
  - phases: `safe_shell`, `real_context`, `first_proof`, `proof_pack`, `optional_verification`, `publish_portfolio`
- Completion logic now matches that corridor:
  - `src/lib/profile/completion-flow.ts`
- Home CTA now reflects first-proof language:
  - `src/app/app/i/home/page.tsx`
- Guided setup now uses proof-first step labels:
  - `src/components/profile/GuidedProfileSetupView.tsx`
- Export and delete still exist:
  - `src/app/api/user/export/route.ts`
  - `src/app/api/user/account/route.ts`

Partially implemented:

- The old broader editable profile corridor still exists:
  - `src/components/profile/EditableProfileView.tsx`
  - `src/components/profile/editable-profile/ProfileTabsSection.tsx`
- The expertise subsystem still offers older skill-proof flows:
  - `src/app/app/i/expertise/**`
  - `src/app/api/expertise/**`

Claimed but not actually implemented:

- A fully clean individual corridor with no competing legacy path.

Workflow/state-machine gaps:

- Optional verification is placed after first proof, which aligns.
- Match-visible and intro-eligible behavior still depends on mixed readiness and legacy verification infrastructure.

### C. Proof system

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Onboarding now writes canonical proof objects directly:
  - `src/actions/onboarding.ts`
  - inserts `proof_artifacts`, `proof_packs`, `proof_pack_items`
- Public export surfaces now resolve to Proof Pack data structures:
  - `src/lib/portfolio/text-pack.ts`
  - `src/lib/portfolio/pdf.ts`
  - `src/app/api/portfolio/public/[handle]/export/route.ts`

Partially implemented:

- Canonical proof projections are real:
  - `src/lib/proofs/canonical-pack.ts`
- Compatibility translation still exists:
  - `src/lib/canonical/repository.ts`
  - `src/app/api/expertise/user-skills/[id]/proofs/[proofId]/route.ts`

Claimed but not actually implemented:

- Proof Pack as the only operational proof object across all product flows.

Backend integrity gaps:

- `src/db/schema.ts` leaves `primary_subject_type` and `primary_subject_id` nullable.
- This means orphan packs are still structurally possible.

Behavior evidence:

- Unavailable profile exports now correctly return `404`.
- Accessible seeded profile `sofia-martinez` returned a public summary with zero proof packs, so published public Proof Pack behavior remains only partially demonstrated with live sample data.

### D. Skills logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Readiness now expects role-relevant skills to resolve back to anchored Proof Packs:
  - `src/lib/readiness/individual-state.ts`

Partially implemented:

- The expertise system still supports legacy standalone skill operations:
  - `src/app/api/expertise/user-skills/**`
  - `src/app/app/i/expertise/**`
- Compatibility logic still maps canonical proof objects back into older skill-proof shapes:
  - `src/lib/proofs/canonical-pack.ts`

Claimed but not actually implemented:

- Complete elimination of floating, unsupported skills.

Interpersonal/universal skill handling:

- Human-observed attestation support is now bounded and structurally safer:
  - `src/lib/verification/human-attestations.ts`
- This is real progress.

### E. Verification logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Canonical verification policy supports stale, contradicted, disputed, revoked, and downgraded states:
  - `src/lib/verification/policy.ts`
- Human-observed attestation is structured:
  - `src/lib/verification/human-attestations.ts`

Partially implemented:

- The user-visible verification corridor still depends on legacy request tables:
  - `src/app/app/i/verifications/page.tsx`
  - `src/app/api/verify/[token]/route.ts`
  - `src/app/api/verify/custom/[token]/route.ts`
- New request kinds are layered onto older request transport.

Contradictory current implementation:

- `src/app/api/verification/status/route.ts` still returns compatibility-style `verificationTier`.
- `src/lib/verification/policy.ts` still computes `workplace_verified` and `identity_verified`.
- `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md` explicitly says LinkedIn import or employment-verification logic is not MVP trust logic.

Assessment:

- Verification is more sophisticated than before.
- It is still not cleanly scoped to claims and facts in the exposed trust layer.

### F. Privacy and reveal

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The previous public export leak is fixed:
  - `src/app/api/portfolio/public/[handle]/summary/route.ts`
  - `src/app/api/portfolio/public/[handle]/export/route.ts`
  - `src/lib/portfolio/public-projection.ts`
- The unavailable public page still renders a generic unavailable shell:
  - `src/app/portfolio/[handle]/page.tsx`

Partially implemented:

- Privacy and reveal contracts exist:
  - `src/lib/privacy/effective-visibility.ts`
  - `src/lib/matching/review-contract.ts`
- Public portfolio and matching reveal remain logically separate in code.

Unverified:

- Authenticated reveal progression, timeout handling, and narrowest-wins behavior across live organization review queries were not rerun end to end in this pass.

Assessment:

- The biggest known public privacy bug is fixed.
- Full reveal enforcement is still not fully behavior-verified.

### G. Organization corridor

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The org profile page is now explicitly narrow and launch-facing:
  - `src/app/app/o/[slug]/profile/page.tsx`
- The new trust editor focuses on:
  - mission
  - why the work matters
  - working context
  - hiring-process clarity
  - website
  - `src/components/organization/OrgTrustProfileEditor.tsx`
- The public org page now presents a minimal public trust card:
  - `src/app/portfolio/org/[slug]/page.tsx`

Partially implemented:

- Canonical roles exist and are used in newer flow code:
  - `src/lib/authz/policy.ts`
  - `src/app/api/engagement-verifications/[id]/route.ts`
- Assignment builder and interviews remain in scope:
  - `src/app/app/o/[slug]/assignments/new/page.tsx`
  - `src/app/app/o/[slug]/interviews/page.tsx`

Claimed but not actually implemented:

- Optional proof issuance support after engagement was not found as a user-facing org workflow.

Legacy drift:

- The schema still carries older organization visibility, structure, project, partnership, impact, and culture-era surfaces:
  - `src/db/schema.ts`
  - `src/app/api/organizations/[orgId]/**`

### H. Hiring and engagement logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Hire and engagement verification are now distinct:
  - `src/lib/workflow/contracts.ts`
  - `src/db/schema.ts`
  - `src/lib/engagement-verifications/service.ts`
- Supported engagement types are normalized:
  - `full_time`
  - `part_time`
  - `contract_consulting`
  - `fractional_project`

Partially implemented:

- Candidate and organization confirmation flows are exposed in interviews UI:
  - `src/app/app/i/interviews/page.tsx`
  - `src/app/app/o/[slug]/interviews/page.tsx`
- Proof-hook eligibility is tracked:
  - `src/lib/engagement-verifications/service.ts`
  - `src/db/schema.ts`

Claimed but not actually implemented:

- Optional proof issuance support after verified engagement.

Assessment:

- This area is much stronger than the prior audit.

### I. Matching and explanation

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The codebase still contains explicit reason-code and review-contract machinery:
  - `src/app/api/match/explain/[matchId]/route.ts`
  - `src/lib/matching/review-contract.ts`
- Readiness logic now references anchored proof, fresh proof, and trust anchors:
  - `src/lib/readiness/individual-state.ts`

Partially implemented:

- Matching-profile onboarding now captures engagement type:
  - `src/actions/onboarding.ts`
  - `src/db/schema.ts`

Unverified:

- Privacy-safe early-stage matching behavior across live authenticated org review was not rerun end to end.

Assessment:

- The model appears aligned.
- Full live corridor verification still needs seeded authenticated reruns.

### J. Launch operations and safety

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P0`

Fully implemented and aligned:

- Go/no-go and smoke tooling exist:
  - `scripts/go-no-go-check.ts`
  - `scripts/launch-smoke-runner.ts`
- Launch contracts exist:
  - `src/lib/launch/contracts.ts`
- Audit and transition tracking exist across workflow tables in `src/db/schema.ts`

Partially implemented:

- The operational system is not currently in a launch-green state.

Behavior evidence:

- `GET /api/monitoring/launch-status` returned stale failures for:
  - `api_health`
  - `login_entry`
  - `portfolio_publish_render`
  - `signup_auth`
  - `invite_redemption`
  - `delete_unpublish`
  - `export`
  - plus additional stale p2 monitors

Assessment:

- Runbook compliance is currently not met.

## 5. Contradictions and legacy drift

Contradictions between source docs:

- `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md` begins with a superseded note claiming the active stack now starts with `Proofound_Project_Specification_2026-03-11.md`.
- That contradicts the audit instruction and the same file’s own locked-precedence section.
- This audit follows the precedence explicitly supplied for the audit:
  1. locked MVP document
  2. aligned rewrite PRD
  3. aligned technical requirements
  4. aligned launch runbook
  5. project specification

Implemented but should be removed, archived, or ignored:

- `src/app/api/mobile/**`
- `src/app/api/admin/**`
- `src/app/api/wellbeing/**`
- large older org-suite endpoints in `src/app/api/organizations/[orgId]/**`
- dashboard-heavy and fairness-heavy legacy support code still present outside the locked MVP corridor

Documented but should no longer define launch truth:

- Repo governance and broader project memory still mention older platform breadth:
  - `AGENTS.md`
  - `project/Prompt.md`
  - `project/Architecture.md`
  - `README.md`

Old semantics still present:

- Legacy org roles are still normalized into canonical roles:
  - `src/lib/authz/policy.ts`
- Legacy verification request tables remain active:
  - `skill_verification_requests`
  - `impact_story_verification_requests`
- Compatibility proof translation remains active:
  - `src/lib/proofs/canonical-pack.ts`

Hidden scope creep:

- Mobile API surface
- Admin analytics surface
- Wellbeing surface
- Older expertise verification surface

## 6. Launch blockers

Only real blockers:

1. `P0` Launch-status is red.
   - The runbook requires fresh monitors and smoke evidence.
   - Current launch-status is failing.

2. `P1` Verification trust semantics still contradict the locked MVP.
   - Work email and LinkedIn still surface as compatibility trust tiers.

3. `P1` Proof Pack integrity is not fully enforced at the data layer.
   - The locked MVP requires one primary anchor context.
   - The schema still allows orphan packs.

4. `P1` Canonical proof and verification flow is still mixed with legacy skill and impact verification systems.
   - This increases launch risk and semantic drift.

## 7. Recommended fix order

Fix first:

1. Refresh launch monitors and smoke artifacts until `GET /api/monitoring/launch-status` is green.
2. Remove or suppress compatibility trust-tier output from verification status and public trust semantics.
3. Enforce primary anchor context at the schema and service layer for Proof Packs.
4. Continue collapsing legacy verification request flows into canonical Proof Pack-centered verification flows.

Can wait slightly: 5. Finish behavior verification for authenticated reveal corridors and privacy-stage enforcement. 6. Wire optional proof issuance after engagement verification if it remains launch scope.

Delete instead of fix: 7. Non-MVP mobile APIs if they are not required for launch. 8. Wellbeing APIs and any remaining non-MVP dashboard/fairness surfaces. 9. Older organization-suite endpoints that are outside the narrow launch corridor.

## 8. Final audit judgment

What is truly implemented:

- Public summary/export availability checks are fixed.
- Proof-first onboarding is real in the main individual setup flow.
- Canonical Proof Pack creation is real in onboarding.
- Human-observed attestation has real bounded structure.
- Engagement verification is a real workflow with distinct states and engagement-type normalization.
- Org trust profile editing is much narrower and closer to the locked MVP.

What is partially implemented:

- Proof Pack as the single canonical proof object across all user-facing flows.
- Skill logic as fully subordinate to proof/context.
- Privacy and reveal enforcement across all authenticated corridors.
- Canonical org roles across the entire codebase.
- Launch ops readiness.

What is not implemented:

- Full schema-level prevention of orphan Proof Packs.
- Optional proof issuance support after engagement verification as a user-facing corridor.
- Complete removal of legacy verification transport and expertise-era proof flows.

What contradicts the source of truth:

- Verification status still inflates work email and LinkedIn into visible trust-tier semantics.
- The repo still carries too much non-MVP surface in admin, mobile, wellbeing, and legacy organization APIs.

What should be archived or removed:

- Non-MVP mobile APIs unless required immediately
- Wellbeing APIs
- Older organization-suite endpoints outside the narrow trust/assignment/review corridor
- Legacy expertise verification transport after canonical migration is complete

## 9. Verification results

Code inspection commands:

```bash
sed -n '1,220p' src/app/api/portfolio/public/[handle]/summary/route.ts
sed -n '1,260p' src/app/api/portfolio/public/[handle]/export/route.ts
sed -n '820,980p' src/lib/portfolio/public-projection.ts
sed -n '1,260p' src/app/api/verification/status/route.ts
sed -n '1,260p' src/lib/verification/policy.ts
sed -n '1,260p' src/lib/verification/human-attestations.ts
sed -n '1,320p' src/lib/engagement-verifications/service.ts
sed -n '1,220p' src/app/api/engagement-verifications/[id]/route.ts
sed -n '1,260p' src/lib/portfolio/text-pack.ts
sed -n '1,280p' src/lib/portfolio/pdf.ts
sed -n '1,240p' src/components/organization/OrgTrustProfileEditor.tsx
sed -n '200,340p' src/app/portfolio/org/[slug]/page.tsx
sed -n '1,220p' src/app/app/i/interviews/page.tsx
sed -n '1,240p' src/app/app/o/[slug]/interviews/page.tsx
sed -n '1,220p' src/app/app/o/[slug]/profile/page.tsx
sed -n '1678,1710p' src/db/schema.ts
sed -n '4994,5048p' src/db/schema.ts
```

Focused search commands:

```bash
rg -n "safe_shell|first_proof|proof_pack|optional_verification|publish_portfolio|Add your first proof|Proof Pack" \
  src/components/onboarding/IndividualSetup.tsx \
  src/components/profile/GuidedProfileSetupView.tsx \
  src/lib/profile/completion-flow.ts \
  src/lib/readiness/individual-state.ts \
  src/app/app/i/home/page.tsx

rg -n "skill_verification_requests|impact_story_verification_requests|human_observed_attestation|generic_verification" \
  src/app/app/i/verifications/page.tsx \
  src/app/app/i/verifications/VerificationsClient.tsx \
  src/app/api/verify \
  src/app/api/expertise \
  src/lib/verification

rg -n "i/zen|settings/fairness|analytics/fairness|i/expertise|api/mobile|api/admin|api/wellbeing|archived" \
  src/app src/lib/mvp src/components/navigation src/components/app src/lib/ui/v2/routeMeta.ts tests/ui/archived-mvp-routes.test.ts
```

Runtime commands:

```bash
npm run dev
curl --max-time 25 -sS http://localhost:3000/api/health
curl --max-time 25 -sS http://localhost:3000/api/monitoring/launch-status
curl --max-time 25 -i -sS http://localhost:3000/api/portfolio/public/nenah-impact/summary
curl --max-time 25 -I -sS http://localhost:3000/api/portfolio/public/nenah-impact/export
curl --max-time 25 -sS http://localhost:3000/portfolio/nenah-impact
curl --max-time 25 -i -sS http://localhost:3000/api/portfolio/public/sofia-martinez/summary
```

Observed outcomes:

- `GET /api/health`: `PASS`
- `GET /api/monitoring/launch-status`: `FAIL`
- `GET /api/portfolio/public/nenah-impact/summary`: `PASS`, now returns `404`
- `GET /api/portfolio/public/nenah-impact/export`: `PASS`, now returns `404`
- `GET /portfolio/nenah-impact`: `PASS`, unavailable portfolio shell rendered
- `GET /api/portfolio/public/sofia-martinez/summary`: `PASS`, accessible public summary returned `200`

Targeted automated checks to run after this report:

- `npm run test -- tests/ui/public-portfolio-access-consistency.test.tsx tests/ui/individual-setup-proof-first.test.tsx tests/lib/engagement-verifications.test.ts tests/lib/human-attestations.test.ts tests/ui/archived-mvp-routes.test.ts tests/lib/portfolio-text-pack.test.ts`

Targeted automated checks actually run:

- `npm run test -- tests/ui/public-portfolio-access-consistency.test.tsx tests/ui/individual-setup-proof-first.test.tsx tests/lib/engagement-verifications.test.ts tests/lib/human-attestations.test.ts tests/ui/archived-mvp-routes.test.ts tests/lib/portfolio-text-pack.test.ts`
  - `PASS`
  - 6 test files passed
  - 24 tests passed
  - notable warning only: React warned about invalid `action` prop usage on the onboarding form in `src/components/onboarding/IndividualSetup.tsx`, but the test still passed
