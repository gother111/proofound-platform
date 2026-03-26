# Proofound Hard Audit Rerun 2026-03-14: Current System vs Locked MVP

Date: 2026-03-14

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
- Feature-flagged or archived functionality counts as not launched.
- If behavior was not rerun or was not reachable in the local environment, it is labeled `UNVERIFIED`.

## 1. Executive verdict

The current system is materially closer to the locked MVP than the previous rerun and is now in pilot-launchable shape.

Estimated alignment: 82%.

Launch judgment: pilot-launchable.

What improved since the 2026-03-13 rerun:

- Proof Pack anchor enforcement is now hardened in both schema and migration logic.
- Verification status is now exposed through a narrower channel-based contract instead of the old top-level tier response.
- The individual verification screen now explicitly frames work-email and LinkedIn as account-side compatibility signals only.
- Launch-surface cleanup now includes explicit API classification and middleware coverage, not just archived route pages.

What still prevents a fully clean locked-MVP alignment verdict:

- The verification request corridor still mixes canonical records with legacy `skill_verification_requests` and `impact_story_verification_requests` transport.
- Legacy, non-MVP internal surfaces still exist in admin, mobile, and wellbeing APIs, even if they are now classified or archived.
- Full authenticated org review, reveal, and matching explanation flows were not rerun end to end in this pass.
- Repo-level verification is not completely clean because `npm run typecheck` currently fails on missing `.next/types` files.

## 2. Top 10 findings

1. `P1 | PARTIALLY_IMPLEMENTED` Verification transport is still mixed. The UI feed now loads through a new adapter, but it still reads legacy request tables.
   - Code evidence:
     - `src/lib/verification/request-feed.ts`
     - `src/app/app/i/verifications/page.tsx`
   - `loadVerificationRequestFeed` still queries `skill_verification_requests` and `impact_story_verification_requests` while merging canonical request records.

2. `P1 | LEGACY_DRIFT` Non-MVP internal surfaces still exist in the current system.
   - Code evidence:
     - `src/app/api/mobile/**`
     - `src/app/api/admin/**`
     - `src/app/api/wellbeing/**`
     - `src/lib/launch/surface-policy.ts`
   - Scope cleanup improved, but the broader API surface is still present in the repo.

3. `P1 | PARTIALLY_IMPLEMENTED` Verification is much cleaner, but not fully canonical end to end.
   - Code evidence:
     - `src/lib/verification/status-contract.ts`
     - `src/app/api/verification/status/route.ts`
     - `src/components/settings/VerificationStatus.tsx`
   - Top-level legacy tier output is gone.
   - Work email and LinkedIn are still exposed as account-side channels and compatibility signals.

4. `P2 | ALIGNED_IMPLEMENTED` Proof Pack anchor enforcement is now real at the storage layer.
   - Code evidence:
     - `src/db/schema.ts`
     - `src/lib/proofs/pack-anchor.ts`
     - `src/db/migrations/20260313210500_harden_proof_pack_anchor_contract.sql`
   - `proof_packs.primary_subject_type` and `proof_packs.primary_subject_id` are now `notNull`.
   - The hardening migration quarantines bad legacy packs before enforcing constraints.

5. `P2 | ALIGNED_IMPLEMENTED` Public summary and public export privacy enforcement remain fixed.
   - Code evidence:
     - `src/app/api/portfolio/public/[handle]/summary/route.ts`
     - `src/app/api/portfolio/public/[handle]/export/route.ts`
   - Behavior evidence:
     - `GET /api/portfolio/public/nenah-impact/summary` returned `404`
     - `HEAD /api/portfolio/public/nenah-impact/export` returned `404`

6. `P2 | ALIGNED_IMPLEMENTED` Proof-first onboarding remains the active individual corridor.
   - Code evidence:
     - `src/components/onboarding/IndividualSetup.tsx`
     - `src/actions/onboarding.ts`
     - `src/lib/readiness/individual-state.ts`
   - Behavior evidence:
     - `tests/ui/individual-setup-proof-first.test.tsx` passed

7. `P2 | ALIGNED_IMPLEMENTED` Engagement verification remains a distinct post-hire workflow with normalized engagement types.
   - Code evidence:
     - `src/lib/engagement-verifications/service.ts`
     - `src/app/api/engagement-verifications/[id]/route.ts`
     - `src/lib/workflow/service.ts`

8. `P2 | ALIGNED_IMPLEMENTED` Launch-surface policy is now explicit and tested.
   - Code evidence:
     - `src/lib/launch/surface-policy.ts`
     - `src/lib/__tests__/middleware-launch-archive.test.ts`
     - `src/lib/launch/__tests__/surface-policy.test.ts`
     - `tests/ui/admin-dashboard-launch-links.test.tsx`

9. `P2 | ALIGNED_IMPLEMENTED` Launch-status remains green, but the first cold request exceeded the short timeout window.
   - Behavior evidence:
     - `GET /api/monitoring/launch-status` timed out once at 25s on cold boot
     - `GET /api/monitoring/launch-status` returned `ok:true` within a 90s retry window
   - This is not a reproduced functional failure, but it is a real runtime latency note.

10. `P2 | PARTIALLY_IMPLEMENTED` Repo verification is not fully clean because `npm run typecheck` currently fails on missing Next-generated type files.
    - Behavior evidence:
      - `npm run typecheck` failed with missing `.next/types/**` entries matched by `tsconfig.json`
    - This is a local verification/config hygiene issue, not a reproduced product-flow failure.

## 3. Source-of-truth alignment table

| Requirement / rule                          | Expected behavior from source of truth                                   | Current implementation evidence                                                                                                                                                                                                                                                                                                                             | Status                  | Severity | Notes                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------- | ----------------------------------------------------------------------------- |
| MVP scope is narrow                         | No ATS, HRIS, marketplace, dashboard, or org-suite sprawl in launch flow | Archived routes in `src/app/app/i/zen/page.tsx`, `src/app/app/i/settings/fairness/page.tsx`, `src/app/app/i/expertise/page.tsx`, `src/app/app/o/[slug]/analytics/fairness/page.tsx`; API classification in `src/lib/launch/surface-policy.ts`; non-MVP APIs still present under `src/app/api/mobile/**`, `src/app/api/admin/**`, `src/app/api/wellbeing/**` | `PARTIALLY_IMPLEMENTED` | `P1`     | Launch surface is narrow, repo surface is broader                             |
| Individual corridor starts with first proof | “Add your first proof” is the real first corridor                        | `src/components/onboarding/IndividualSetup.tsx`, `src/actions/onboarding.ts`, `tests/ui/individual-setup-proof-first.test.tsx`                                                                                                                                                                                                                              | `ALIGNED_IMPLEMENTED`   | `P2`     | Still aligned                                                                 |
| Proof Pack is canonical proof object        | Public, review, and export surfaces resolve back to Proof Packs          | Canonical pack writes in `src/actions/onboarding.ts`; export routes use canonical projection; verification feed still blends legacy request tables in `src/lib/verification/request-feed.ts`                                                                                                                                                                | `PARTIALLY_IMPLEMENTED` | `P1`     | Canonical proof is stronger, not yet exclusive                                |
| Every Proof Pack has one anchor             | No orphan packs for intro-eligible use, enforced structurally            | `src/db/schema.ts`, `src/lib/proofs/pack-anchor.ts`, `src/db/migrations/20260313210500_harden_proof_pack_anchor_contract.sql`                                                                                                                                                                                                                               | `ALIGNED_IMPLEMENTED`   | `P2`     | This was a real fix since the prior rerun                                     |
| Skills are subordinate to proof/context     | No floating unsupported skills in launch corridor                        | Proof-first onboarding and readiness logic are aligned; expertise and verification transport still touch legacy skill flows in `src/lib/verification/request-feed.ts`                                                                                                                                                                                       | `PARTIALLY_IMPLEMENTED` | `P1`     | Better than earlier audits                                                    |
| Verification is claim-scoped and narrow     | No inflated trust shortcut from work email or LinkedIn                   | `src/lib/verification/status-contract.ts`, `src/app/api/verification/status/route.ts`, `src/components/settings/VerificationStatus.tsx`                                                                                                                                                                                                                     | `PARTIALLY_IMPLEMENTED` | `P1`     | Public inflation is gone; internal compatibility signaling remains            |
| Privacy and reveal are enforced in code     | Blind review, progressive reveal, public separate from matching reveal   | `src/lib/privacy/effective-visibility.ts`, `src/lib/matching/review-contract.ts`, public summary/export routes, and runtime 404 checks for hidden handles                                                                                                                                                                                                   | `PARTIALLY_IMPLEMENTED` | `P1`     | Public enforcement is verified; authenticated reveal was not rerun end to end |
| Org roles are canonical                     | `org_owner`, `org_manager`, `org_reviewer`                               | `src/lib/authz/policy.ts`, `src/lib/api/auth.ts`, `src/app/api/engagement-verifications/[id]/route.ts`                                                                                                                                                                                                                                                      | `PARTIALLY_IMPLEMENTED` | `P1`     | Canonical roles are primary; compatibility normalization still exists         |
| Hire and engagement are distinct            | Hire is not engagement verification                                      | `src/lib/engagement-verifications/service.ts`, `src/lib/workflow/service.ts`, `src/db/schema.ts`                                                                                                                                                                                                                                                            | `ALIGNED_IMPLEMENTED`   | `P2`     | Distinct and smoke-covered                                                    |
| Launch ops satisfy runbook                  | Fresh monitors, smoke evidence, safe checks                              | `src/app/api/monitoring/launch-status/route.ts`, `src/lib/launch/synthetic-monitors.ts`, `.artifacts/launch-smoke-report.json`                                                                                                                                                                                                                              | `ALIGNED_IMPLEMENTED`   | `P2`     | Green, with cold-start latency note                                           |

## 4. Area-by-area audit

### A. Product definition and scope

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Major non-MVP launch routes remain archived with `notFound()`:
  - `src/app/app/i/zen/page.tsx`
  - `src/app/app/i/settings/fairness/page.tsx`
  - `src/app/app/i/expertise/page.tsx`
  - `src/app/app/o/[slug]/analytics/fairness/page.tsx`
- Scope policy now exists for internal and archived API surfaces:
  - `src/lib/launch/surface-policy.ts`

Partially implemented:

- The repo still ships broader internal API families.
- This is cleaner than before, but not removed.

Legacy drift:

- `src/app/api/mobile/**`
- `src/app/api/admin/**`
- `src/app/api/wellbeing/**`

### B. Individual corridor

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- The individual corridor is still proof-first:
  - `src/components/onboarding/IndividualSetup.tsx`
  - `src/actions/onboarding.ts`
- The readiness path remains aligned:
  - `src/lib/readiness/individual-state.ts`

Behavior evidence:

- `tests/ui/individual-setup-proof-first.test.tsx` passed

Residual caution:

- Older profile and expertise systems still exist in the repo, but the active onboarding path is aligned.

### C. Proof system

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Proof Pack anchor enforcement now exists in storage and migration:
  - `src/db/schema.ts`
  - `src/lib/proofs/pack-anchor.ts`
  - `src/db/migrations/20260313210500_harden_proof_pack_anchor_contract.sql`
- Public summary and export still resolve through the public projection path.

Partially implemented:

- The verification corridor still merges canonical and legacy request sources:
  - `src/lib/verification/request-feed.ts`

What changed from the prior rerun:

- The old “orphan packs are structurally possible” finding is no longer true in schema terms.

### D. Skills logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The launch corridor now requires context plus proof, not just a free-floating skill list.

Partially implemented:

- Verification and expertise transport still carry older skill-based request semantics:
  - `src/lib/verification/request-feed.ts`
  - `src/app/api/expertise/**`

Unverified:

- Interpersonal and universal skill handling was not rerun as a separate safety corridor in this pass.

### E. Verification logic

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- The status route now returns a channel-based contract instead of exposing old top-level tier fields:
  - `src/lib/verification/status-contract.ts`
  - `src/app/api/verification/status/route.ts`
- The UI now explicitly frames both work email and LinkedIn as compatibility signals only:
  - `src/components/settings/VerificationStatus.tsx`

Partially implemented:

- Legacy request tables still remain in the verification feed.
- Canonical verification records and legacy transport still coexist.

What no longer applies:

- The prior audit finding about visible public trust-tier inflation is no longer supported by current code or tests.

### F. Privacy and reveal

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Public summary and export still enforce accessibility before returning data:
  - `src/app/api/portfolio/public/[handle]/summary/route.ts`
  - `src/app/api/portfolio/public/[handle]/export/route.ts`
- Hidden public pages still render unavailable output:
  - `src/app/portfolio/[handle]/page.tsx`

Behavior evidence:

- `GET /api/portfolio/public/nenah-impact/summary` returned `404`
- `HEAD /api/portfolio/public/nenah-impact/export` returned `404`
- `GET /portfolio/nenah-impact` rendered unavailable copy

Unverified:

- Authenticated org-review reveal escalation was not rerun end to end in this pass.

### G. Organization corridor

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Public org trust presentation remains narrow:
  - `src/app/portfolio/org/[slug]/page.tsx`
- Canonical role policy remains primary:
  - `src/lib/authz/policy.ts`

Partially implemented:

- Compatibility normalization from legacy org roles still exists.
- Full assignment-builder and review-queue browser behavior were not rerun in this pass.

### H. Hiring / engagement logic

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- Hire and engagement verification are distinct:
  - `src/lib/engagement-verifications/service.ts`
  - `src/app/api/engagement-verifications/[id]/route.ts`
  - `src/lib/workflow/service.ts`
- Engagement type normalization still covers:
  - `full_time`
  - `part_time`
  - `contract_consulting`
  - `fractional_project`

Behavior evidence:

- `tests/lib/engagement-verifications.test.ts` passed
- `tests/lib/launch-engagement-verification-smoke.test.ts` passed

### I. Matching and explanation

Status: `PARTIALLY_IMPLEMENTED`  
Severity: `P1`

Fully implemented and aligned:

- Matching and review contracts remain in code:
  - `src/lib/matching/review-contract.ts`

Partially implemented:

- Full explainability and readiness enforcement were not rerun through authenticated org review screens in this pass.
- The cleaned launch corridor still sits beside broader matching and expertise code.

### J. Launch operations and safety

Status: `ALIGNED_IMPLEMENTED`  
Severity: `P2`

Fully implemented and aligned:

- Launch-status is live and green:
  - `src/app/api/monitoring/launch-status/route.ts`
- Surface-policy and archive behavior now have explicit tests:
  - `src/lib/launch/__tests__/surface-policy.test.ts`
  - `src/lib/__tests__/middleware-launch-archive.test.ts`
- Internal admin entry points are explicitly treated as internal launch ops:
  - `src/components/admin/AdminDashboard.tsx`

Behavior evidence:

- `GET /api/monitoring/launch-status` returned `ok:true`, `readinessState:"ready"`, `p1Failures:0`, `p2Failures:0`
- The first cold request exceeded the 25s timeout window, but the retry succeeded within 90s

## 5. Contradictions and legacy drift

Resolved since earlier audits:

- The source-of-truth precedence conflict is resolved in repo instructions.
- Proof Pack anchor enforcement is no longer only a workflow/readiness rule.
- Verification status no longer exposes the old top-level tier contract to clients.

Implemented but should be removed or archived:

- `src/app/api/mobile/**`
- `src/app/api/admin/**`
- `src/app/api/wellbeing/**`

Old semantics still present:

- Legacy verification request tables inside the live verification feed
- Legacy org-role compatibility normalization in `src/lib/authz/policy.ts`

Hidden scope creep still present:

- Internal-only admin and support surfaces that remain broader than the locked MVP, even if they are not part of the launch corridor

## 6. Launch blockers

No fresh P0 runtime or privacy blocker was reproduced in this rerun.

What still blocks a fully clean locked-MVP launch judgment:

- The live verification corridor still relies on legacy request tables.
- Some non-MVP internal surfaces still exist in the current system instead of being fully removed or archived.
- Repo verification is not fully clean because `npm run typecheck` currently fails on missing `.next/types` files.

## 7. Recommended fix order

1. Finish migrating the verification request corridor off legacy request tables.
2. Remove or archive non-MVP internal API families that are no longer needed for launch.
3. Clean up repo verification so `npm run typecheck` can pass without relying on missing generated `.next/types` files.
4. Re-run an authenticated org-review corridor pass to verify reveal, explanation, and final decision behavior against the current cleaned launch surface.

## 8. Final audit judgment

What is truly implemented:

- Proof-first onboarding
- Public portfolio gating for page, summary, and export
- Narrow public organization trust card
- Distinct engagement verification workflow
- Launch-surface archive policy
- Storage-level Proof Pack anchor enforcement
- Live launch monitoring with green status

What is partially implemented:

- Fully canonical verification request transport
- Fully cleaned MVP-only system surface
- End-to-end authenticated org review verification in this rerun

What is not fully implemented:

- A completely legacy-free verification corridor
- A fully cleaned repo surface with non-MVP internal families removed

What contradicts the source of truth:

- No new direct contradiction as severe as the earlier privacy leak was reproduced in this rerun.
- The remaining gaps are mostly partial implementation and legacy drift, not current hard contradiction.

What should be archived or removed:

- Non-MVP mobile, admin, and wellbeing APIs that are no longer part of the launch corridor
- Legacy verification request transport once the canonical feed fully replaces it

## 9. Verification results

Commands run and outcomes:

- `npm run dev`
  - `PASS`
  - Local dev server started on `http://localhost:3001` because port `3000` was already occupied by another process
- `curl --max-time 25 -sS http://localhost:3001/api/health`
  - `PASS`
- `curl --max-time 25 -sS http://localhost:3001/api/monitoring/launch-status`
  - `FAIL`
  - Cold request timed out at 25s with no response
- `curl --max-time 90 -sS http://localhost:3001/api/monitoring/launch-status`
  - `PASS`
  - Returned `ok:true`, `readinessState:"ready"`, `source:"live"`, `expectedMonitors:9`, `reportedMonitors:9`, `p1Failures:0`, `p2Failures:0`
- `curl --max-time 25 -i -sS http://localhost:3001/api/portfolio/public/nenah-impact/summary`
  - `PASS`
  - Returned `404`
- `curl --max-time 25 -I -sS http://localhost:3001/api/portfolio/public/nenah-impact/export`
  - `PASS`
  - Returned `404`
- `curl --max-time 25 -i -sS http://localhost:3001/api/portfolio/public/sofia-martinez/summary`
  - `PASS`
  - Returned `200`
- `curl --max-time 25 -sS http://localhost:3001/portfolio/nenah-impact | rg -n "Portfolio unavailable|Public Profile Unavailable|Shareable by direct link"`
  - `PASS`
- `npm run test -- tests/ui/public-portfolio-access-consistency.test.tsx tests/ui/individual-setup-proof-first.test.tsx tests/lib/engagement-verifications.test.ts tests/lib/human-attestations.test.ts tests/ui/archived-mvp-routes.test.ts tests/lib/portfolio-text-pack.test.ts tests/lib/launch-hardening-contract.test.ts tests/lib/launch-synthetic-monitors.test.ts tests/lib/launch-assignment-publish-smoke.test.ts tests/lib/launch-engagement-verification-smoke.test.ts src/app/api/monitoring/__tests__/launch-status-route.test.ts tests/api/verification-status-route.test.ts tests/api/mobile-verification-status-route.test.ts tests/lib/proof-pack-anchor.test.ts tests/lib/verification-policy.test.ts tests/ui/verification-status-options.test.tsx tests/ui/verifications-page.test.tsx`
  - `PASS`
  - 17 files, 58 tests passed
  - Non-blocking warnings only:
    - invalid React `action` prop in `src/components/onboarding/IndividualSetup.tsx`
    - expected fallback log in `tests/ui/verifications-page.test.tsx`
    - expected schema-missing log in `tests/api/verification-status-route.test.ts`
- `npm run test -- src/lib/launch/__tests__/surface-policy.test.ts src/lib/__tests__/middleware-launch-archive.test.ts tests/ui/admin-dashboard-launch-links.test.tsx`
  - `PASS`
  - 3 files, 11 tests passed
- `npm run lint`
  - `PASS`
  - 0 errors, 2 warnings for raw `<img>` usage in landing-page components
- `npm run typecheck`
  - `FAIL`
  - Missing `.next/types/**` files referenced by `tsconfig.json`
- `npm run docs:freshness`
  - `PASS_WITH_WARNINGS`
  - Reported existing orphan-doc warnings for:
    - `docs/proofound-hard-audit-2026-03-12.md`
    - `docs/proofound-hard-audit-2026-03-12-rerun.md`
    - `docs/proofound-hard-audit-2026-03-12-rerun-2.md`
