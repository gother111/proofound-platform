# Proofound Hard Audit Rerun 2: Current System vs Locked MVP

Date: 2026-03-12

> Superseded note added 2026-03-25:
> - This file is preserved as historical evidence only and does not override the locked MVP stack or newer `.artifacts/*` current-state evidence.
> - Stale categories in or around this rerun: mixed live verification transport conclusions, any `PageNotFoundError: /_document` build-blocker claims, any `pilot-launchable` or similar launch verdict treated as current truth, and older route-surface claims where newer route inventory disagrees.
> - Current repo truth differs: `npm run build` and `npm run typecheck` now pass under Node `20.20.0`, fresh strict org-corridor evidence is not green today, and route breadth remains an open launch risk.

Audit basis:

- Current checked-out workspace, including all modified and untracked files
- Local runtime behavior from the dev server
- The same audit source-of-truth precedence used in the prior hard audits:
  1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
  2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
  3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
  4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
  5. `Proofound_Project_Specification_2026-03-11.md`

Rules applied:

- No credit for TODOs, placeholders, mocks, or dead code.
- No credit for schema-only capability without usable product flow.
- No credit for UI-only behavior if backend enforcement is missing.
- Archived route pages count as not launched.
- If behavior was not rerun or not reachable, it is labeled `UNVERIFIED`.

## 1. Executive verdict

The current system is materially closer to the locked MVP than either prior audit, but it is still not cleanly aligned.

Estimated alignment: 68%.

Launch judgment: partially launchable.

What changed since the previous rerun:

- `launch-status` is now green and backed by live monitor evaluation.
- The public summary/export privacy fix remains intact.
- Proof-first onboarding remains intact.
- Engagement verification remains implemented and smoke-covered.

What still prevents a clean “aligned” verdict:

- Verification trust semantics still over-credit work email and LinkedIn compatibility tiers.
- Proof Pack anchoring is still not enforced at the schema layer.
- Legacy verification request transport still sits beside the canonical Proof Pack model.
- The repo still carries broad non-MVP internal surfaces in admin, mobile, wellbeing, and legacy organization APIs.

## 2. Top 10 findings

1. `P1 | CONTRADICTS_SOURCE_OF_TRUTH` Verification status still exposes compatibility trust tiers driven by work email and LinkedIn.
   - Code evidence:
     - `src/app/api/verification/status/route.ts`
     - `src/lib/verification/policy.ts`
     - `src/lib/verification/tier.ts`
   - The response still exposes `verificationTier: unverified | workplace_verified | identity_verified`.
   - `effectiveIdentityVerified = policySummary.compatibility.verified` still drives the visible status.
   - This conflicts with `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, which says LinkedIn import or employment-verification logic is not MVP trust logic.

2. `P1 | PARTIALLY_IMPLEMENTED` Proof Pack is now much closer to canonical, but the verification corridor still depends on legacy request tables.
   - Code evidence:
     - `src/actions/onboarding.ts`
     - `src/lib/proofs/canonical-pack.ts`
     - `src/app/app/i/verifications/page.tsx`
     - `src/app/api/verify/[token]/route.ts`
     - `src/app/api/expertise/**`
   - Onboarding writes `proof_artifacts`, `proof_packs`, and `proof_pack_items`.
   - Verification still rides through `skill_verification_requests` and `impact_story_verification_requests`.

3. `P1 | PARTIALLY_IMPLEMENTED` Orphan Proof Packs are still structurally possible.
   - Code evidence:
     - `src/db/schema.ts`
     - `src/lib/readiness/individual-state.ts`
   - `proof_packs.primary_subject_type` and `proof_packs.primary_subject_id` are nullable.
   - Readiness now blocks intro eligibility for orphan packs, but the database does not.

4. `P1 | PARTIALLY_IMPLEMENTED` The individual launch corridor is now proof-first, but older profile and expertise systems still coexist.
   - Code evidence:
     - `src/components/onboarding/IndividualSetup.tsx`
     - `src/lib/profile/completion-flow.ts`
     - `src/components/profile/GuidedProfileSetupView.tsx`
     - `src/components/profile/EditableProfileView.tsx`
     - `src/app/app/i/expertise/page.tsx`
   - The main onboarding corridor is aligned.
   - Legacy editing and expertise verification flows still exist beside it.

5. `P1 | PARTIALLY_IMPLEMENTED` Scope creep is reduced in launch UI, but broad non-MVP surfaces remain implemented in the current system.
   - Code evidence:
     - `src/app/app/i/zen/page.tsx`
     - `src/app/app/i/settings/fairness/page.tsx`
     - `src/app/app/i/expertise/page.tsx`
     - `src/app/app/o/[slug]/analytics/fairness/page.tsx`
     - `src/app/api/mobile/**`
     - `src/app/api/admin/**`
     - `src/app/api/wellbeing/**`
   - The route pages now archive cleanly with `notFound()`.
   - The wider API and schema surface still exists in the shipped repo.

6. `P1 | PARTIALLY_IMPLEMENTED` Org auth is mostly on canonical roles now, but compatibility normalization remains.
   - Code evidence:
     - `src/lib/authz/policy.ts`
     - `src/lib/api/auth.ts`
     - `src/app/api/engagement-verifications/[id]/route.ts`
   - Canonical roles are real and active.
   - Legacy `owner/admin/member/viewer` normalization still exists.

7. `P2 | ALIGNED_IMPLEMENTED` The public summary/export privacy leak remains fixed.
   - Code evidence:
     - `src/app/api/portfolio/public/[handle]/summary/route.ts`
     - `src/app/api/portfolio/public/[handle]/export/route.ts`
     - `src/lib/portfolio/public-projection.ts`
   - Behavior evidence:
     - `GET /api/portfolio/public/nenah-impact/summary` returned `404`
     - `HEAD /api/portfolio/public/nenah-impact/export` returned `404`

8. `P2 | ALIGNED_IMPLEMENTED` Launch monitoring and smoke readiness are now live and green.
   - Code evidence:
     - `src/app/api/monitoring/launch-status/route.ts`
     - `src/lib/launch/synthetic-monitors.ts`
     - `.artifacts/launch-smoke-report.json`
   - Behavior evidence:
     - `GET /api/monitoring/launch-status` returned `ok:true`
     - `expectedMonitors: 9`
     - `p1Failures: 0`
     - `p2Failures: 0`

9. `P2 | ALIGNED_IMPLEMENTED` Engagement verification is now a real, distinct workflow.
   - Code evidence:
     - `src/lib/engagement-verifications/service.ts`
     - `src/app/api/engagement-verifications/[id]/route.ts`
     - `src/db/schema.ts`
     - `src/lib/workflow/contracts.ts`
     - `src/app/app/i/interviews/page.tsx`
     - `src/app/app/o/[slug]/interviews/page.tsx`

10. `P2 | PARTIALLY_IMPLEMENTED` Public exports now render Proof Pack structure, but the available seeded public example still has zero public packs.
    - Code evidence:
      - `src/lib/portfolio/text-pack.ts`
      - `src/lib/portfolio/pdf.ts`
    - Behavior evidence:
      - `GET /api/portfolio/public/sofia-martinez/summary` returned `200`
      - The returned summary still showed `Selected Proof Packs: 0`

## 3. Source-of-truth alignment table

| Requirement / rule                          | Expected behavior from source of truth                                                            | Current implementation evidence                                                                                                                                                                                                                                                                                   | Status                        | Severity | Notes                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- | --------------------------------------------------------------------------- |
| MVP scope is narrow                         | No ATS, HRIS, marketplace, org-suite, or dashboard sprawl in launch flow                          | Archived route pages now `notFound()` in `src/app/app/i/zen/page.tsx`, `src/app/app/i/settings/fairness/page.tsx`, `src/app/app/i/expertise/page.tsx`, `src/app/app/o/[slug]/analytics/fairness/page.tsx`; but non-MVP APIs remain in `src/app/api/mobile/**`, `src/app/api/admin/**`, `src/app/api/wellbeing/**` | `PARTIALLY_IMPLEMENTED`       | `P1`     | Launch UI is narrower than repo surface                                     |
| Individual corridor starts with first proof | `Add your first proof` is the primary corridor                                                    | `src/components/onboarding/IndividualSetup.tsx`, `src/lib/profile/completion-flow.ts`, `src/components/profile/GuidedProfileSetupView.tsx`, `src/app/app/i/home/page.tsx`                                                                                                                                         | `ALIGNED_IMPLEMENTED`         | `P2`     | This is now a real implementation, not just copy                            |
| Proof Pack is canonical proof object        | User-facing proof should resolve back to Proof Packs                                              | Onboarding now writes canonical proof objects in `src/actions/onboarding.ts`; public export uses `src/lib/portfolio/text-pack.ts` and `src/lib/portfolio/pdf.ts`; verification still uses legacy request tables in `src/app/app/i/verifications/page.tsx` and `src/app/api/verify/[token]/route.ts`               | `PARTIALLY_IMPLEMENTED`       | `P1`     | Canonical proof got stronger, verification transport still lags             |
| Every Proof Pack has one anchor             | No orphan packs for intro-eligible users                                                          | `src/db/schema.ts` still leaves `primary_subject_type` and `primary_subject_id` nullable; `src/lib/readiness/individual-state.ts` blocks intro eligibility for orphan packs                                                                                                                                       | `PARTIALLY_IMPLEMENTED`       | `P1`     | Enforced in readiness, not enforced in storage                              |
| Skills are subordinate to proof/context     | No floating unsupported skills                                                                    | `src/lib/readiness/individual-state.ts` now expects anchored Proof Pack support, but legacy expertise APIs remain in `src/app/api/expertise/**`                                                                                                                                                                   | `PARTIALLY_IMPLEMENTED`       | `P1`     | Better than before, still mixed                                             |
| Verification is claim-scoped                | Work email and LinkedIn must not overstate trust                                                  | `src/app/api/verification/status/route.ts`, `src/lib/verification/policy.ts`, `src/lib/verification/tier.ts`                                                                                                                                                                                                      | `CONTRADICTS_SOURCE_OF_TRUTH` | `P1`     | This remains the sharpest semantic conflict                                 |
| Privacy and reveal are enforced in code     | Blind review, progressive reveal, consented identity reveal, public separate from matching reveal | `src/lib/privacy/effective-visibility.ts`, `src/lib/matching/review-contract.ts`, `src/app/api/portfolio/public/[handle]/summary/route.ts`, `src/app/api/portfolio/public/[handle]/export/route.ts`                                                                                                               | `PARTIALLY_IMPLEMENTED`       | `P1`     | Public export gate is fixed; full authenticated reveal not rerun end to end |
| Org roles are canonical                     | `org_owner`, `org_manager`, `org_reviewer`                                                        | `src/lib/authz/policy.ts`, `src/lib/api/auth.ts`, `src/app/api/engagement-verifications/[id]/route.ts`                                                                                                                                                                                                            | `PARTIALLY_IMPLEMENTED`       | `P1`     | Canonical role use is strong, compatibility mapping still exists            |
| Hire and engagement are distinct            | Hire is not engagement verification                                                               | `src/lib/engagement-verifications/service.ts`, `src/db/schema.ts`, `src/lib/workflow/contracts.ts`, `src/app/app/i/interviews/page.tsx`, `src/app/app/o/[slug]/interviews/page.tsx`                                                                                                                               | `ALIGNED_IMPLEMENTED`         | `P2`     | Distinct and smoke-covered                                                  |
| Launch ops satisfy runbook                  | Fresh monitors, smoke coverage, safe launch evidence                                              | `src/app/api/monitoring/launch-status/route.ts`, `src/lib/launch/synthetic-monitors.ts`, `.artifacts/launch-smoke-report.json`                                                                                                                                                                                    | `ALIGNED_IMPLEMENTED`         | `P2`     | Previously failing, now green                                               |

## 4. Area-by-area audit

### A. Product definition and scope

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Non-MVP UI routes are now archived behind `notFound()`:
  - `src/app/app/i/zen/page.tsx`
  - `src/app/app/i/settings/fairness/page.tsx`
  - `src/app/app/i/expertise/page.tsx`
  - `src/app/app/o/[slug]/analytics/fairness/page.tsx`
- Regression coverage exists:
  - `tests/ui/archived-mvp-routes.test.ts`

Partially implemented:

- The launch-facing UI surface is much narrower.
- The repo still contains broad non-MVP APIs and schema surfaces in mobile, admin, wellbeing, and older organization modules.

What exists but is out of scope:

- `src/app/api/mobile/**`
- `src/app/api/admin/**`
- `src/app/api/wellbeing/**`

What should be archived or removed:

- Non-MVP API families that are not required for the launch corridor.

### B. Individual corridor

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The core onboarding corridor is now proof-first:
  - `src/components/onboarding/IndividualSetup.tsx`
- Completion-state logic matches that corridor:
  - `src/lib/profile/completion-flow.ts`
- Guided setup and home CTA both reflect first-proof semantics:
  - `src/components/profile/GuidedProfileSetupView.tsx`
  - `src/app/app/i/home/page.tsx`

Partially implemented:

- Legacy profile editing and expertise subsystems still coexist:
  - `src/components/profile/EditableProfileView.tsx`
  - `src/components/profile/editable-profile/ProfileTabsSection.tsx`
  - `src/app/app/i/expertise/**`

Behavior evidence:

- Focused UI tests passed for the proof-first setup order.

### C. Proof system

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Onboarding now writes canonical proof structures directly:
  - `src/actions/onboarding.ts`
- Public text and PDF export paths use Proof Pack-oriented structures:
  - `src/lib/portfolio/text-pack.ts`
  - `src/lib/portfolio/pdf.ts`

Partially implemented:

- Compatibility bridging remains in place:
  - `src/lib/proofs/canonical-pack.ts`
  - `src/lib/canonical/repository.ts`
- Verification still depends on legacy request tables.

Backend integrity missing:

- `src/db/schema.ts` still allows anchorless packs.

### D. Skills logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Readiness now expects role-relevant skills to resolve back to anchored Proof Packs:
  - `src/lib/readiness/individual-state.ts`

Partially implemented:

- Standalone expertise-era skill flows still remain:
  - `src/app/api/expertise/**`
  - `src/app/app/i/expertise/**`

Improvement:

- Human-observed attestation support now safely bounds interpersonal/universal skills:
  - `src/lib/verification/human-attestations.ts`

### E. Verification logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Canonical verification policy supports freshness, contradiction, dispute, revocation, and downgrade semantics:
  - `src/lib/verification/policy.ts`
- Human-observed attestation is structurally bounded:
  - `src/lib/verification/human-attestations.ts`

Partially implemented:

- Operational verification flows still ride through legacy request tables and older token corridors:
  - `src/app/app/i/verifications/page.tsx`
  - `src/app/api/verify/[token]/route.ts`
  - `src/app/api/verify/custom/[token]/route.ts`

Contradiction:

- Compatibility trust tiers still over-credit work email and LinkedIn.

### F. Privacy and reveal

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Public summary/export privacy enforcement remains fixed:
  - `src/app/api/portfolio/public/[handle]/summary/route.ts`
  - `src/app/api/portfolio/public/[handle]/export/route.ts`
- Unavailable public profile still renders a generic unavailable shell:
  - `src/app/portfolio/[handle]/page.tsx`

Partially implemented:

- Privacy/reveal contracts remain in code:
  - `src/lib/privacy/effective-visibility.ts`
  - `src/lib/matching/review-contract.ts`

Unverified:

- Authenticated reveal-stage behavior was not rerun end to end with seeded org/candidate accounts in this pass.

### G. Organization corridor

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The org profile page is now explicitly launch-narrow:
  - `src/app/app/o/[slug]/profile/page.tsx`
- Trust editor is focused on the locked MVP trust story:
  - `src/components/organization/OrgTrustProfileEditor.tsx`
- The public org page presents a minimal trust card:
  - `src/app/portfolio/org/[slug]/page.tsx`

Partially implemented:

- Older broader organization APIs and schema structures still exist in parallel:
  - `src/app/api/organizations/[orgId]/**`
  - `src/db/schema.ts`

### H. Hiring and engagement logic

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- Engagement verification is distinct from hire.
- Supported engagement types are normalized:
  - `full_time`
  - `part_time`
  - `contract_consulting`
  - `fractional_project`
- Candidate and org confirmation flows are exposed in interviews UI.
- Launch smoke coverage exists for engagement verification.

Remaining gap:

- Optional proof issuance support after engagement verification was still not found as a user-facing flow.

### I. Matching and explanation

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Reason-code and review-contract machinery remain in place:
  - `src/app/api/match/explain/[matchId]/route.ts`
  - `src/lib/matching/review-contract.ts`
- Matching profile now carries engagement type in onboarding and schema.

Unverified:

- Full authenticated match-review privacy behavior was not rerun in this pass.

### J. Launch operations and safety

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- `launch-status` now runs live monitor evaluation:
  - `src/app/api/monitoring/launch-status/route.ts`
  - `src/lib/launch/synthetic-monitors.ts`
- Current runtime result is green.
- Smoke artifact freshness is current.
- Focused launch-monitor and smoke tests pass.

This is a real change from the prior rerun.

## 5. Contradictions and legacy drift

Document contradictions:

- The locked MVP doc changed again and now declares a precedence order that points to `PRD_for_a_web_platform_MVP.master-latest.md` and `PRD_TECHNICAL_REQUIREMENTS.md`.
- That conflicts with the audit stack used in the prior hard audits and with the aligned-rewrite document set.
- This rerun kept the same audit precedence as the previous audits for consistency.

Old semantics still present:

- Compatibility verification tiers
- Legacy org-role normalization
- Legacy verification request tables
- Compatibility proof translation layers

Hidden scope creep still present in code:

- Mobile APIs
- Admin analytics and moderation surfaces
- Wellbeing surfaces
- Older organization-suite endpoints

## 6. Launch blockers

Current real blockers:

- No fresh P0 runtime blocker was verified in this rerun.

Remaining launch-relevant misalignments:

1. Verification trust semantics still contradict the locked MVP.
2. Proof Pack anchor requirements are still not enforced at the storage layer.
3. Legacy verification transport is still mixed into the canonical proof system.

If strict locked-MVP conformance is the bar, these remain blockers.  
If pilot launchability is the bar, the system is now closer to partially launchable.

## 7. Recommended fix order

Fix first:

1. Remove compatibility trust-tier output from verification status and public trust semantics.
2. Enforce Proof Pack primary anchor requirements at the schema or write-service layer.
3. Continue collapsing legacy verification request transport into canonical Proof Pack-centered verification flows.

Fix next: 4. Remove or archive non-MVP API families that are not required for launch. 5. Re-run authenticated reveal and org-review corridors with seeded accounts and archive the evidence.

Delete instead of polish: 6. Non-MVP mobile APIs if they are not required immediately. 7. Wellbeing APIs and related surfaces. 8. Legacy expertise and older organization-suite endpoints that are outside the locked corridor.

## 8. Final audit judgment

What is truly implemented:

- Proof-first onboarding
- Public portfolio gating for summary/export
- Live launch monitoring and fresh smoke readiness
- Engagement verification as a distinct workflow
- Minimal org trust profile editing and rendering
- Human-observed attestation structure

What is partially implemented:

- Proof Pack as the sole canonical proof object across all user-facing flows
- Skills as fully subordinate to anchored proof
- Full privacy/reveal behavior across authenticated matching corridors
- Canonical org-role enforcement across the whole codebase

What is not implemented:

- Schema-level prevention of orphan Proof Packs
- Optional proof issuance after engagement verification as a usable flow
- Full removal of legacy verification transport

What contradicts the source of truth:

- Verification trust semantics still elevate work email and LinkedIn into visible compatibility tiers.

What should be archived or removed:

- Non-MVP mobile APIs
- Wellbeing APIs
- Older organization-suite and expertise-era APIs outside the launch corridor

## 9. Verification results

Runtime commands:

```bash
npm run dev
curl --max-time 25 -sS http://localhost:3000/api/health
curl --max-time 25 -sS http://localhost:3000/api/monitoring/launch-status
curl --max-time 25 -i -sS http://localhost:3000/api/portfolio/public/nenah-impact/summary
curl --max-time 25 -I -sS http://localhost:3000/api/portfolio/public/nenah-impact/export
curl --max-time 25 -i -sS http://localhost:3000/api/portfolio/public/sofia-martinez/summary
curl --max-time 25 -sS http://localhost:3000/portfolio/nenah-impact
```

Observed runtime outcomes:

- `GET /api/health` -> `PASS`
- `GET /api/monitoring/launch-status` -> `PASS`
- `GET /api/portfolio/public/nenah-impact/summary` -> `PASS`, returned `404`
- `HEAD /api/portfolio/public/nenah-impact/export` -> `PASS`, returned `404`
- `GET /api/portfolio/public/sofia-martinez/summary` -> `PASS`, returned `200`
- `GET /portfolio/nenah-impact` -> `PASS`, unavailable profile shell rendered

Focused automated verification:

```bash
npm run test -- \
  tests/ui/public-portfolio-access-consistency.test.tsx \
  tests/ui/individual-setup-proof-first.test.tsx \
  tests/lib/engagement-verifications.test.ts \
  tests/lib/human-attestations.test.ts \
  tests/ui/archived-mvp-routes.test.ts \
  tests/lib/portfolio-text-pack.test.ts \
  tests/lib/launch-hardening-contract.test.ts \
  tests/lib/launch-synthetic-monitors.test.ts \
  tests/lib/launch-assignment-publish-smoke.test.ts \
  tests/lib/launch-engagement-verification-smoke.test.ts \
  src/app/api/monitoring/__tests__/launch-status-route.test.ts
```

Observed test outcomes:

- `PASS`
- 11 test files passed
- 33 tests passed
- non-blocking warning only: React still warns about an invalid `action` prop on the onboarding form in `src/components/onboarding/IndividualSetup.tsx`
