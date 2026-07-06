# Proofound Hard Audit Rerun 2026-03-13

Date: 2026-03-13

> Superseded note added 2026-03-25:
>
> - This file is preserved as historical evidence only and does not override the locked MVP stack or newer `.artifacts/*` current-state evidence.
> - Stale categories in or around this rerun: mixed live verification transport conclusions, any `PageNotFoundError: /_document` build-blocker claims, any `pilot-launchable` or similar launch verdict treated as current truth, and older route-surface claims where newer route inventory disagrees.
> - Current repo truth differs again as of 2026-05-19: route breadth is no longer an open launch-surface blocker in `docs/verification-checklist.md`; use `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md` and newer focused checks before citing this report.

## Scope and audit basis

This rerun compared the checked-out system against the locked MVP authority stack:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_Project_Specification_2026-03-11.md`

Rules used in this rerun:

- No credit for dead code, placeholders, mocks, or archived routes.
- No credit for schema capability without a working user corridor.
- No credit for green monitoring if the artifact behind it is stale.
- When the full corridor did not pass in one uninterrupted run, results are recorded as segmented evidence rather than a blanket pass.

## Executive verdict

Verdict: `NO-GO`

The system is materially closer to the locked MVP than the previous audit, and several launch-critical corridors are now real rather than aspirational. That said, this rerun still found two launch blockers and several important drift items:

- The organization publish corridor still returns `403` in strict runtime reruns, which blocks the locked MVP flow from draft role to internal review to publish.
- `launch-status` can report green while relying on a stale smoke artifact, which is a false-green operational signal.
- The organization match and post-match corridor can work, but locally it is extremely slow and required widened test timeouts to complete.
- Canonical proof is stronger but not exclusive. Legacy verification transport and compatibility fields are still active.
- Proof Pack anchors are still nullable in storage, so orphan packs remain structurally possible.
- Non-MVP API families remain in the active repo surface even though the main launch UI has been narrowed.

## Highest-signal findings

### 1. Organization publish is still blocking the locked MVP corridor

Status: `BLOCKER`

Evidence:

- Strict organization reruns repeatedly hit publish failure with `403`.
- This affects the required launch corridor: org role creation -> review -> publish.
- The runtime workaround for later org tests was to reuse a separately seeded active assignment so the downstream shortlist and interview steps could still be exercised.

Impact:

- A green-ish downstream org corridor is not enough for launch if the canonical publish step fails in the strict path.

### 2. Launch monitoring still has a false-green path

Status: `BLOCKER`

Evidence:

- `curl http://127.0.0.1:33100/api/monitoring/launch-status` returned `ok:true`.
- The same payload reported a smoke artifact timestamp of `2026-03-13T08:59:41.537Z`.
- At audit time, that artifact was about 68 minutes old.

Impact:

- Operators can see a green launch panel without fresh smoke evidence.
- This weakens the launch runbook because a stale report can mask a newly broken corridor.

### 3. Organization corridor is real but too slow for comfort

Status: `HIGH RISK`

Evidence from reruns and server logs:

- `/api/match/assignment` completed with `resultCount: 1`, but took about `73s` to `78s`.
- `POST /api/interviews/schedule` needed a request timeout increase to `120000`.
- Role creation, interest, contract, and interview flow segments passed only after widening timeouts in the org strict spec.
- A Next dev server restart was observed during the audit: `Server is approaching the used memory threshold, restarting...`

Impact:

- The user flow can complete, but it is brittle under local runtime pressure and too slow to treat as confidently launch-ready.

### 4. Proof Pack anchoring is still not enforced at the schema layer

Status: `P1 drift`

Code evidence:

- `src/db/schema.ts:1686-1689` keeps `proof_packs.primarySubjectType` and `proof_packs.primarySubjectId` nullable.

Impact:

- Readiness logic can block some orphan-pack usage, but storage still permits invalid state.

### 5. Verification semantics still mix canonical and legacy models

Status: `P1 drift`

Code evidence:

- `src/app/api/verification/status/route.ts:51-99` still includes legacy fallback querying.
- `src/app/api/verification/status/route.ts:178-229` still returns compatibility fields such as `linkedinVerificationLevel`, `linkedinHasIdentityVerification`, and `workEmailVerified`.
- `src/app/app/i/verifications/VerificationsClient.tsx:30-48` still models requests as `'skill' | 'impact_story'`.
- `src/app/app/i/verifications/VerificationsClient.tsx:200-208` and `src/app/app/i/verifications/VerificationsClient.tsx:252-254` still call `/api/expertise/verifications/...`.

Impact:

- The public trust surface is cleaner than before, but the internal verification system is not yet fully claim-scoped and canonical.

### 6. Launch UI is narrower, but non-MVP APIs still remain

Status: `P2 drift`

Evidence:

- Non-MVP API families still exist under:
  - `src/app/api/admin/**`
  - `src/app/api/mobile/**`
  - `src/app/api/wellbeing/**`
- The org settings launch route is intentionally gated:
  - `src/app/app/o/[slug]/settings/page.tsx`
  - Heading: `Broad org settings are gated for launch`

Impact:

- This is not a launch-corridor blocker by itself, but the active repo surface is still broader than the locked MVP.

## What was verified as implemented

### Verified runtime and test evidence

- `npm run typecheck` passed.
- `npm run lint` passed with 2 existing warnings about raw `<img>` usage in landing components.
- `curl http://127.0.0.1:33100/api/health` returned healthy with database connected.
- `curl http://127.0.0.1:33100/api/monitoring/perf-status` returned warning mode, but `ok:true` and probe-based latency under the configured budget.
- Focused Vitest packs passed:
  - `tests/api/verification-status-route.test.ts`
  - `tests/ui/archived-mvp-routes.test.ts`
  - `tests/ui/public-portfolio-access-consistency.test.tsx`
  - `tests/lib/public-trust-export-data.test.ts`
  - `tests/lib/engagement-verifications.test.ts`
  - `tests/lib/workflow-contracts.test.ts`
  - `tests/api/match-interest-route.test.ts`
  - `tests/lib/canonical-proof-pack.test.ts`
  - `tests/lib/verification-integrity-alignment.test.ts`
  - `tests/actions/onboarding.test.ts`
  - `tests/lib/individual-readiness-state.test.ts`
  - `tests/api/interviews-edit-route.test.ts`
  - `tests/api/interviews-schedule-route.test.ts`
  - `tests/api/decisions-route.test.ts`
  - `tests/lib/interviews-process-state.test.ts`
  - `tests/lib/launch-engagement-verification-smoke.test.ts`

### Verified organization strict segments

The full org strict suite did not complete as one pristine uninterrupted pass. The rerun still produced segmented evidence that the corridor largely works when the publish blocker is bypassed:

- O-02..O-04 passed.
- O-05..O-07 passed once timeouts were widened.
- O-07b passed after updating the assertion to the current UI label `why this role exists`.
- O-08..O-12 passed after seeding a portfolio-ready candidate and reusing an active assignment when publish did not succeed.
- O-13..O-16 passed after widening interview scheduling timeout.
- O-17 passed.
- O-18..O-20 passed in a targeted rerun.

What this means:

- Matching, shortlist, messaging, interviews, and contract-decision segments are real.
- Publish remains the clean gating problem.
- Runtime speed and dev-server stability remain serious concerns.

## False-green and confidence notes

Confidence in these conclusions is moderate to high for the areas above because they are based on live reruns, targeted test packs, and direct code inspection.

Confidence is lower for any claim that the entire org corridor is launch-ready end to end because:

- the full strict org suite was not observed passing in one uninterrupted run
- the dev server restarted during audit
- several org requests needed widened timeouts to complete

## Recommended launch call

Do not launch on the basis of this rerun alone.

Minimum fixes before a responsible go decision:

1. Fix the org publish `403` in the strict launch corridor and re-run the full org strict suite cleanly.
2. Make `launch-status` fail or degrade when smoke evidence is stale beyond an acceptable freshness window.
3. Reduce org corridor latency enough that strict tests do not rely on inflated timeouts.

Important follow-up fixes after blockers:

1. Enforce non-null Proof Pack anchors at the schema layer.
2. Remove the remaining legacy verification transport and compatibility fields from active internal APIs.
3. Continue shrinking or isolating non-MVP API surface.

## Commands run in this rerun

```bash
npm run typecheck
npm run lint

node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-02..O-04"
node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-05..O-07|O-17"
node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-07b"
node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-08..O-12"
node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-13..O-16"
node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-18..O-20"

npx vitest run tests/api/verification-status-route.test.ts tests/ui/archived-mvp-routes.test.ts tests/ui/public-portfolio-access-consistency.test.tsx tests/lib/public-trust-export-data.test.ts tests/lib/engagement-verifications.test.ts tests/lib/workflow-contracts.test.ts tests/api/match-interest-route.test.ts
npx vitest run tests/lib/canonical-proof-pack.test.ts tests/lib/verification-integrity-alignment.test.ts tests/actions/onboarding.test.ts tests/lib/individual-readiness-state.test.ts
npx vitest run tests/api/interviews-edit-route.test.ts tests/api/interviews-schedule-route.test.ts tests/api/decisions-route.test.ts tests/lib/interviews-process-state.test.ts tests/lib/launch-engagement-verification-smoke.test.ts

curl http://127.0.0.1:33100/api/health
curl http://127.0.0.1:33100/api/monitoring/perf-status
curl http://127.0.0.1:33100/api/monitoring/launch-status
```

## Bottom line

This rerun upgrades the system from "mostly claimed" to "substantially real but still not launch-safe."

The strongest evidence in favor of progress is that public privacy gates, proof-first onboarding, canonical proof-pack behavior, engagement verification, and most org post-publish segments now have real passing evidence.

The strongest evidence against launch is that the org publish corridor still fails in strict runtime, monitoring can still read green off stale smoke data, and the org corridor remains too slow and brittle to treat as cleanly launch-ready.
