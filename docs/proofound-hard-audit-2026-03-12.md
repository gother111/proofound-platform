# Proofound Hard Audit: Current System vs Locked MVP

Date: 2026-03-12

Audit basis:

- Repository code and current checked-out workspace
- Runtime behavior from local dev server
- Source-of-truth documents in this precedence order:
  1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
  2. `PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md`
  3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
  4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
  5. `Proofound_Project_Specification_2026-03-11.md`

Rules applied:

- No credit for TODOs, placeholders, mocks, or dead code.
- No credit for UI-only behavior if backend enforcement is missing.
- No credit for backend-only tables if usable product flow is missing.
- Feature-flagged disabled surfaces are treated as not launched.
- If behavior could not be verified, it is labeled `UNVERIFIED`.

## 1. Executive Verdict

The current system is not aligned with the locked MVP.

Estimated alignment: 40%.

Launch judgment: not launchable.

The biggest problems are structural:

- the live product surface is wider than the locked MVP
- the individual corridor is still profile-first, not proof-first
- the proof system is only partially canonical in actual product flow
- a real privacy enforcement gap exists on public export routes

## 2. Top 10 Findings

1. `P0 | CONTRADICTS_SOURCE_OF_TRUTH` Public summary/export bypass the public-page availability gate.
   - Code evidence:
     - `src/app/portfolio/[handle]/page.tsx`
     - `src/app/api/portfolio/public/[handle]/summary/route.ts`
     - `src/app/api/portfolio/public/[handle]/export/route.ts`
     - `src/lib/portfolio/export-data.ts`
     - `src/lib/portfolio/public-projection.ts`
   - The page route blocks unavailable portfolios with `isAccessiblePublicPortfolioState(...)`, but the public text-summary and PDF export routes return `projection.exportData` without re-checking accessibility.
   - Runtime evidence:
     - `GET /portfolio/nenah-impact` rendered `Portfolio unavailable`
     - `GET /api/portfolio/public/nenah-impact/summary` returned `200`
     - `GET /api/portfolio/public/nenah-impact/export` returned `200` PDF
   - Failure type: auth/privacy enforcement missing

2. `P0 | CONTRADICTS_SOURCE_OF_TRUTH` The individual launch corridor is still profile-completion-first, not `Add your first proof` first.
   - Evidence:
     - `src/components/profile/GuidedProfileSetupView.tsx`
     - `src/lib/profile/completion-flow.ts`
     - `src/components/profile/EditableProfileView.tsx`
     - `src/components/profile/editable-profile/ProfileTabsSection.tsx`
     - `src/lib/readiness/individual-state.ts`
   - Current behavior still starts with name, values, causes, profile basics, and skills.
   - Failure type: workflow/state-machine missing

3. `P1 | PARTIALLY_IMPLEMENTED` Proof Pack exists, but it is not the single canonical user-facing proof object across flows.
   - Evidence:
     - `src/db/schema.ts`
     - `src/lib/proofs/canonical-pack.ts`
     - `src/actions/onboarding.ts`
     - `src/lib/canonical/repository.ts`
     - `src/app/app/i/verifications/page.tsx`
   - Canonical tables and projections exist, but onboarding still writes legacy `skill_proofs` first and verification UI still runs on legacy skill/impact request tables.
   - Failure type: code exists but not wired into canonical product flow

4. `P1 | CONTRADICTS_SOURCE_OF_TRUTH` The shipped product surface is broader than the locked MVP, and some out-of-scope routes are live.
   - Evidence:
     - `src/app/app/i/zen/page.tsx`
     - `src/app/app/i/settings/fairness/page.tsx`
     - `src/app/app/o/[slug]/analytics/fairness/page.tsx`
     - `src/app/app/i/expertise/page.tsx`
     - `src/app/api/wellbeing/**`
     - `src/app/api/mobile/**`
     - `src/app/api/admin/**`
   - Runtime evidence:
     - `GET /app/i/zen` redirected to `/login`, proving the route is live, not removed.
   - Failure type: out-of-scope active surface

5. `P1 | CONTRADICTS_SOURCE_OF_TRUTH` Verification still inflates work-email and LinkedIn state into trust tiers and public trust signals.
   - Evidence:
     - `src/app/api/verification/status/route.ts`
     - `src/lib/verification/policy.ts`
     - `src/lib/portfolio/public-projection.ts`
     - `src/lib/portfolio/trust-signals.ts`
     - `src/db/migrations/20260227151000_add_verification_tiers_and_linkedin_levels.sql`
   - `workplace_verified` and `identity_verified` remain active shortcuts.
   - Failure type: docs claim unsupported by trust semantics in code

6. `P1 | PARTIALLY_IMPLEMENTED` Org roles are modeled canonically, but auth and route checks are still mixed with legacy `owner/admin/member/viewer`.
   - Evidence:
     - `src/lib/authz/policy.ts`
     - `src/lib/api/auth.ts`
     - `src/app/api/decisions/route.ts`
     - `src/app/api/match/explain/[matchId]/route.ts`
   - Failure type: backend/auth logic mixed between canonical and legacy semantics

7. `P1 | DOCUMENTED_NOT_IMPLEMENTED` Distinct engagement verification is not present as a real workflow.
   - Evidence:
     - `src/lib/workflow/service.ts`
     - `src/app/api/decisions/route.ts`
     - `src/lib/decisions/automation.ts`
     - `src/db/schema.ts`
   - `hire` is real. Separate engagement verification was not found in routes or actions.
   - Failure type: workflow/state-machine missing

8. `P2 | CONTRADICTS_SOURCE_OF_TRUTH` Public recruiter-summary/export surfaces do not resolve back to Proof Packs.
   - Evidence:
     - `src/lib/portfolio/public-projection.ts`
     - `src/lib/portfolio/export-data.ts`
     - `src/lib/portfolio/text-pack.ts`
   - Public projection computes `featuredProofs`, but the public text export only emits trust summary and top skills.
   - Failure type: code exists but not wired into output surface

9. `P0 | PARTIALLY_IMPLEMENTED` Launch ops tooling exists, but current launch status is failing.
   - Evidence:
     - `scripts/go-no-go-check.ts`
     - `scripts/launch-smoke-runner.ts`
     - `src/lib/launch/contracts.ts`
   - Runtime evidence:
     - `GET /api/monitoring/launch-status` returned `ok:false` with stale `p1Failures` and `p2Failures`
   - Failure type: launch/safety execution gap

10. `P2 | LEGACY_DRIFT` Org trust/profile pages still carry broader org-suite semantics.
    - Evidence:
      - `src/app/app/o/[slug]/profile/page.tsx`
      - `src/components/profile/EmptyOrganizationProfileView.tsx`
    - The page still reaches into culture, executive, ownership, and broader company-profile territory.
    - Failure type: legacy drift

## 3. Source-of-Truth Alignment Table

| Requirement / rule                                      | Expected behavior from source of truth                                               | Current implementation evidence                                                                                                                                                                     | Status                        | Severity | Notes                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------------------------------------------------------ |
| MVP scope is narrow                                     | Only proof-first portfolio, matching, reveal, org trust, assignment, review corridor | Live out-of-scope routes: `src/app/app/i/zen/page.tsx`, `src/app/app/i/settings/fairness/page.tsx`, `src/app/app/o/[slug]/analytics/fairness/page.tsx`, `src/app/app/i/expertise/page.tsx`          | `CONTRADICTS_SOURCE_OF_TRUTH` | `P1`     | Some legacy pages are gated, but not all               |
| Individual corridor starts with first proof             | `Add your first proof` should be the primary onboarding action                       | `src/components/profile/GuidedProfileSetupView.tsx`, `src/lib/profile/completion-flow.ts`, `src/lib/readiness/individual-state.ts`                                                                  | `CONTRADICTS_SOURCE_OF_TRUTH` | `P0`     | Current flow is name/values/profile/skills first       |
| Proof Pack is canonical proof object                    | All important proof surfaces resolve to Proof Packs                                  | `src/db/schema.ts`, `src/lib/proofs/canonical-pack.ts`, but `src/actions/onboarding.ts` still writes legacy `skill_proofs`; `src/app/app/i/verifications/page.tsx` still uses legacy request tables | `PARTIALLY_IMPLEMENTED`       | `P1`     | Canonical layer exists, product flow is mixed          |
| Every Proof Pack has one primary anchor                 | No orphan packs for intro-eligible users                                             | `src/db/schema.ts` makes `primarySubjectType` and `primarySubjectId` nullable                                                                                                                       | `PARTIALLY_IMPLEMENTED`       | `P1`     | Structurally allowed orphan packs exist                |
| Skills subordinate to proof/context                     | No floating unsupported skills                                                       | `src/lib/profile/completion-flow.ts`, `src/lib/portfolio/public-projection.ts`, `src/lib/readiness/individual-state.ts`                                                                             | `PARTIALLY_IMPLEMENTED`       | `P1`     | Skills still stand alone and drive readiness           |
| Verification is claim-scoped, not identity-inflated     | Work email / LinkedIn should not overstate trust                                     | `src/app/api/verification/status/route.ts`, `src/lib/verification/policy.ts`, `src/lib/portfolio/public-projection.ts`                                                                              | `CONTRADICTS_SOURCE_OF_TRUTH` | `P1`     | Identity tiers are still active                        |
| Privacy and reveal must be enforced in code             | Blind-first, consent-based, narrowest-wins                                           | `src/lib/privacy/effective-visibility.ts`, `src/lib/matching/review-contract.ts`, but public summary/export routes bypass availability gate                                                         | `PARTIALLY_IMPLEMENTED`       | `P0`     | Core privacy model exists, route enforcement is broken |
| Org corridor uses canonical roles and narrow trust page | `org_owner`, `org_manager`, `org_reviewer`; minimal trust page                       | `src/lib/authz/policy.ts`, `src/app/portfolio/org/[slug]/page.tsx`, but mixed role checks remain and org profile page is too broad                                                                  | `PARTIALLY_IMPLEMENTED`       | `P1`     | Canonical intent, mixed execution                      |
| Hire and engagement are distinct                        | Explicit hire plus distinct engagement verification                                  | `src/db/schema.ts`, `src/lib/workflow/service.ts`, `src/lib/decisions/automation.ts`                                                                                                                | `PARTIALLY_IMPLEMENTED`       | `P1`     | `hire` exists, engagement verification flow not found  |
| Launch ops and safe mode are real                       | Smoke, monitors, go-no-go, safe-mode flags, auditability                             | `scripts/go-no-go-check.ts`, `scripts/launch-smoke-runner.ts`, `src/lib/launch/contracts.ts`, `src/db/policies.sql`                                                                                 | `PARTIALLY_IMPLEMENTED`       | `P0`     | Tooling exists; current runtime status is failing      |

## 4. Area-by-Area Audit

### A. Product definition and scope

Status: `CONTRADICTS_SOURCE_OF_TRUTH`  
Severity: `P1`

Fully implemented and aligned:

- Explicit non-launch gating exists:
  - `src/lib/mvp/nonLaunch.ts`
  - `src/lib/featureFlags.ts`

Partially implemented:

- Some legacy surfaces are marked non-launch:
  - `src/app/app/o/[slug]/candidates/page.tsx`
  - `src/app/app/o/[slug]/members/page.tsx`
  - `src/app/app/o/[slug]/team/page.tsx`
  - `src/app/app/i/projects/page.tsx`

Claimed but not actually implemented as locked MVP:

- Repo governance still promotes the broader project spec first:
  - `AGENTS.md`
  - `project/Prompt.md`
  - `project/Architecture.md`
  - `README.md`

Out-of-scope or contradictory live product:

- `src/app/app/i/zen/page.tsx`
- `src/app/app/i/settings/fairness/page.tsx`
- `src/app/app/o/[slug]/analytics/fairness/page.tsx`
- `src/app/app/i/expertise/page.tsx`
- `src/app/api/mobile/**`
- `src/app/api/admin/**`
- `src/app/api/wellbeing/**`

Legacy drift:

- Dashboard, fairness, wellbeing, expertise, and admin analytics remain shipped.

Launch risk:

- High. The active surface is still broader than the locked corridor.

### B. Individual corridor

Status: `CONTRADICTS_SOURCE_OF_TRUTH`  
Severity: `P0`

Fully implemented and aligned:

- Public portfolio shortcut exists:
  - `src/app/app/i/portfolio/page.tsx`
- Export/delete exists:
  - `src/app/api/user/export/route.ts`
  - `src/app/api/user/account/route.ts`

Partially implemented:

- Public portfolio as a destination exists:
  - `src/app/app/i/home/page.tsx`
  - `src/app/portfolio/[handle]/page.tsx`

Claimed but not actually implemented:

- `Add your first proof` as the primary corridor.

Contradictory current implementation:

- Onboarding and readiness are still profile-first:
  - `src/components/profile/GuidedProfileSetupView.tsx`
  - `src/lib/profile/completion-flow.ts`
  - `src/lib/readiness/individual-state.ts`
- Current editor still centers legacy tabs and impact-style flows:
  - `src/components/profile/EditableProfileView.tsx`
  - `src/components/profile/editable-profile/ProfileTabsSection.tsx`

Workflow gap:

- No verified end-to-end first-proof-first corridor was found.

### C. Proof system

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Canonical proof tables and pack/item structure exist:
  - `src/db/schema.ts`
  - `src/lib/proofs/canonical-pack.ts`

Partially implemented:

- Canonical read/projection layer exists, but compatibility code is still required:
  - `src/lib/canonical/repository.ts`

Claimed but not actually implemented:

- Proof Pack as the sole proof object across user-facing flows.

Contradictions:

- Onboarding still writes legacy `skill_proofs` first:
  - `src/actions/onboarding.ts`
- Public exports do not carry proof packs through:
  - `src/lib/portfolio/text-pack.ts`

Structural gap:

- Orphan packs are possible because anchor fields are nullable:
  - `src/db/schema.ts`

### D. Skills logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- None proven.

Partially implemented:

- Some canonical proof aggregation can associate proof to skill:
  - `src/lib/proofs/canonical-pack.ts`

Claimed but not actually implemented:

- Skills always subordinate to proof/context.

Contradictions:

- Portfolio readiness still depends on one skill plus one proof/verification:
  - `src/lib/profile/completion-flow.ts`
- Public projection still uses plain public skills:
  - `src/lib/portfolio/public-projection.ts`
- Readiness actions still direct people to expertise and skills:
  - `src/lib/readiness/individual-state.ts`

Unverified:

- Safe separate handling for interpersonal/universal skills.

### E. Verification logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Canonical verification records, contradiction, dispute, and policy layers exist:
  - `src/db/schema.ts`
  - `src/lib/verification/policy.ts`

Partially implemented:

- Freshness and contradiction states appear structurally represented.

Claimed but not actually implemented:

- Clean claim-scoped verification without identity inflation.

Contradictions:

- Work email and LinkedIn still feed verification tiers and trust shortcuts:
  - `src/app/api/verification/status/route.ts`
  - `src/lib/portfolio/public-projection.ts`
  - `src/lib/portfolio/trust-signals.ts`

Legacy drift:

- Live user verification page still centers old skill and impact verification request flows:
  - `src/app/app/i/verifications/page.tsx`

### F. Privacy and reveal

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P0`

Fully implemented and aligned:

- Narrowest-wins visibility logic exists:
  - `src/lib/privacy/effective-visibility.ts`
- Progressive reveal model exists:
  - `src/lib/matching/review-contract.ts`

Partially implemented:

- Public portfolio page itself enforces accessibility state:
  - `src/app/portfolio/[handle]/page.tsx`

Contradictions:

- Public export and summary routes bypass the page-level accessibility check:
  - `src/app/api/portfolio/public/[handle]/summary/route.ts`
  - `src/app/api/portfolio/public/[handle]/export/route.ts`
  - `src/lib/portfolio/export-data.ts`

Behavior evidence:

- `/portfolio/nenah-impact` unavailable
- `/api/portfolio/public/nenah-impact/summary` returned recruiter summary
- `/api/portfolio/public/nenah-impact/export` returned PDF

Launch risk:

- Direct blocker. Privacy enforcement is inconsistent between routes.

### G. Organization corridor

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Minimal public org trust card exists:
  - `src/app/portfolio/org/[slug]/page.tsx`
- Assignment builder exists:
  - `src/app/app/o/[slug]/assignments/new/page.tsx`
- Matching page exists:
  - `src/app/app/o/[slug]/matching/page.tsx`
- Decision flow exists:
  - `src/app/api/decisions/route.ts`
  - `src/lib/workflow/service.ts`

Partially implemented:

- Canonical org roles exist:
  - `src/lib/authz/policy.ts`

Claimed but not actually implemented:

- Optional proof issuance support as a clear org flow.

Contradictions and drift:

- Org profile/editor still carries broader org-suite content:
  - `src/app/app/o/[slug]/profile/page.tsx`
  - `src/components/profile/EmptyOrganizationProfileView.tsx`

Unverified:

- Full review queue, intro request, reveal request, and interview flow UX end to end under authenticated org runtime.

### H. Hiring / engagement logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- `hire` is a real decision state:
  - `src/db/schema.ts`
  - `src/lib/workflow/service.ts`
  - `src/lib/decisions/automation.ts`

Claimed but not actually implemented:

- Distinct engagement verification after hire.

Unverified:

- Normalized support across full-time, part-time, contract-consulting, and fractional-project as one shared corridor.

### I. Matching and explanation

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Reason codes and explanation API exist:
  - `src/app/api/match/explain/[matchId]/route.ts`
  - `src/lib/matching/review-contract.ts`

Partially implemented:

- Blind-first and fairness suppression logic exists in code.

Contradictions:

- Fairness settings and fairness analytics are still active surfaces outside the locked MVP:
  - `src/app/app/i/settings/fairness/page.tsx`
  - `src/app/app/o/[slug]/analytics/fairness/page.tsx`

Unverified:

- Full authenticated org-side explainability and privacy-safe review behavior at runtime.

### J. Launch operations and safety

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P0`

Fully implemented and aligned:

- Launch smoke and go/no-go tooling exists:
  - `scripts/go-no-go-check.ts`
  - `scripts/launch-smoke-runner.ts`
  - `src/lib/launch/contracts.ts`
- Audit log infrastructure exists:
  - `src/db/policies.sql`
  - `src/db/schema.ts`
  - `src/actions/org.ts`
  - `src/lib/launch/trace.ts`

Partially implemented:

- Safe-mode flags exist:
  - `src/lib/featureFlags.ts`
  - `src/lib/launch/contracts.ts`

Contradictions:

- Current launch status is failing because monitors and smoke evidence are stale.

Behavior evidence:

- `GET /api/monitoring/launch-status` returned `ok:false` with stale P1 and P2 failures.

## 5. Contradictions and Legacy Drift

Implemented but should be removed:

- `src/app/app/i/zen/page.tsx`
- `src/app/app/i/settings/fairness/page.tsx`
- `src/app/app/o/[slug]/analytics/fairness/page.tsx`
- `src/app/app/i/expertise/page.tsx`

Documented but should no longer exist as live semantics:

- Broader org-suite profile/culture concepts:
  - `src/app/app/o/[slug]/profile/page.tsx`
  - `src/components/profile/EmptyOrganizationProfileView.tsx`

Old semantics still present:

- Legacy role names:
  - `owner`
  - `admin`
  - `member`
  - `viewer`
- Legacy proof and verification flows:
  - `skill_proofs`
  - `skill_verification_requests`
  - `impact_story_verification_requests`

Hidden scope creep:

- mobile APIs
- admin analytics
- wellbeing APIs
- fairness surfaces
- expertise atlas

## 6. Launch Blockers

- Public summary and PDF export are reachable for a handle whose public page is unavailable.
- The current system does not implement the locked MVP’s core first-proof individual corridor.
- Launch status is currently failing because monitors and smoke artifacts are stale.
- Proof Pack is not yet the single operational proof object across onboarding, verification, and export surfaces.

## 7. Recommended Fix Order

1. Fix public summary/export enforcement so unavailable public pages cannot leak content.
2. Hard-disable or remove live out-of-scope surfaces that are outside the locked MVP.
3. Replace the individual onboarding corridor with a real `Add your first proof` flow.
4. Stop writing new legacy proof records from onboarding and profile flows.
5. Make Proof Pack anchoring mandatory at schema and service level.
6. Remove work-email and LinkedIn trust-tier inflation from compatibility and public trust logic.
7. Normalize route auth to canonical org roles only.
8. Delete org-suite profile sprawl instead of polishing it.
9. Re-run smoke and monitoring from current artifacts and make launch status green.

## 8. Final Audit Judgment

What is truly implemented:

- public portfolio pages
- canonical Proof Pack and verification tables
- narrowest-wins visibility logic
- progressive reveal and decision state machines
- account export/delete and audit logging
- launch smoke and go/no-go tooling

What is partially implemented:

- Proof Pack as the canonical proof object in actual user flows
- organization corridor with canonical roles
- matching explanation and reveal safety
- verification contradiction/dispute handling
- launch operations discipline

What is not implemented:

- a true first-proof-first individual MVP corridor
- a distinct engagement-verification corridor
- clean proof-issuance support in the org corridor
- full elimination of unsupported floating skills

What contradicts the source of truth:

- public export/summary can leak when the public page is unavailable
- verification still uses work-email/LinkedIn trust shortcuts
- live product surface still includes out-of-scope fairness, wellbeing, expertise, admin, and broader platform areas
- the individual corridor is still profile-first and legacy-proof-first

What should be archived or removed:

- Zen / wellbeing corridor
- fairness settings and fairness analytics UI from launch surface
- legacy impact-story and skill-verification request product flows
- broader org profile/culture/governance surfaces outside the minimal trust page
- legacy role semantics in route-level auth checks

## Verification Results

Commands run and outcomes:

- `npm run dev`
  - Pass
  - Local app booted on `http://localhost:3000`

- `curl http://localhost:3000/api/health`
  - Pass
  - Returned healthy with connected database

- `curl -I http://localhost:3000/app/i/zen`
  - Pass
  - Redirected to `/login`, confirming the route is live

- `curl http://localhost:3000/`
  - Pass
  - Landing page is live

- `curl http://localhost:3000/login`
  - Pass
  - Login page is live

- `curl http://localhost:3000/api/feature-flags`
  - Unauthorized
  - Anonymous callers cannot inspect flags

- `curl -I http://localhost:3000/portfolio/nenah-impact`
  - Pass
  - Public route responded, but rendered unavailable state

- `curl http://localhost:3000/api/portfolio/public/nenah-impact/summary`
  - Fail
  - Returned `200` text summary despite unavailable public page

- `curl http://localhost:3000/api/portfolio/public/nenah-impact/export`
  - Fail
  - Returned `200` PDF despite unavailable public page

- `curl -I http://localhost:3000/portfolio/sofia-martinez`
  - Pass
  - Public portfolio is live

- `curl http://localhost:3000/api/monitoring/launch-status`
  - Fail
  - Returned `ok:false` with stale P1 and P2 monitors
