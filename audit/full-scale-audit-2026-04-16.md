# Full-Scale Audit Report

Audit snapshot: `2026-04-16`

## Scope

This report captures a read-only audit of the current local checkout in `/Users/yuriibakurov/proofound`.

Important context:

- This is not a clean-branch audit.
- `git status --short` showed a dirty worktree with modified and untracked files.
- Findings below reflect the current local state and should not be treated as a pristine release baseline.

## Executive Summary

The repository is structurally healthy enough to lint, typecheck, build, and pass its baseline privacy and migration-governance checks. It is not currently release-clean.

The main release blockers are concentrated in three places:

1. The default test suite is materially out of sync with the locked MVP surface and still runs archived or removed surfaces.
2. Active tests and current launch behavior have drifted apart in several live areas.
3. Production dependencies currently carry unresolved security vulnerabilities.

This is a stabilization and release-discipline problem, not a rewrite problem.

## Category Scores

### Test Confidence: 2/5

Coverage breadth is high, but the default signal is currently too noisy and too red to serve as a trustworthy launch gate.

### Release Readiness: 2/5

A release is still achievable after targeted cleanup, but the current baseline should not be described as release-ready.

### Privacy and Governance Confidence: 4/5

Baseline privacy, docs freshness, and migration drift checks are healthy, which materially reduces platform-risk uncertainty.

## Highest-Priority Findings

### FS-01: The default test suite is out of sync with the locked MVP surface

- Status: Fact
- Severity: P0
- Type: Cross-cutting
- Evidence:
  - `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md` narrows the active launch corridor.
  - `vitest.config.ts:60-72` excludes some suites but does not exclude archived surfaces under `src/archive/**`.
  - A machine-readable Vitest rerun found `27` failed files, with `17` import-resolution failures targeting removed or non-launch surfaces.
  - Representative failures include:
    - `src/archive/non_launch_integrations/preserved/tests/api/google-integration-oauth-redirects.test.ts`
    - `tests/api/messages-legacy-route.test.ts`
    - `tests/api/moderation-appeals-route.test.ts`
    - `tests/ui/admin-ai-spend-page.test.tsx`
    - `tests/routes/portfolio-shortcuts.test.tsx`
- Why it matters:
  - The default test command is currently mixing live MVP enforcement with tests for archived or removed functionality.
  - That makes the primary release signal misleading and harder to act on.
- Next action:
  - Remove, relocate, or exclude archived and non-MVP tests from the default suite, then re-baseline the remaining failures.

### FS-02: Production dependencies have unresolved security exposure

- Status: Fact
- Severity: P0
- Type: Dependency risk
- Evidence:
  - `npm audit --omit=dev --json` reported `17` production vulnerabilities, including `11` high severity findings.
  - Directly affected dependencies in `package.json` include:
    - `drizzle-orm@^0.29.4`
    - `next@^15.5.12`
    - `next-intl@^3.9.0`
  - The audit output identified fixed versions at or beyond:
    - `drizzle-orm 0.45.2`
    - `next 15.5.15`
    - `next-intl 4.9.1`
- Why it matters:
  - Even if application logic is stable, shipping with unresolved high-severity production dependency findings weakens launch posture.
- Next action:
  - Upgrade the vulnerable direct dependencies in a controlled pass and re-run the build and gate stack.

### FS-03: Live behavior and tests have drifted apart in currently active areas

- Status: Fact
- Severity: P1
- Type: Correctness and contract drift
- Evidence:
  - `src/app/api/cron/account-deletion-workflow/route.ts:43-57` now returns a generic compatibility message, while `tests/api/cron-account-deletion-workflow-route.test.ts` still expects legacy fairness-note wording.
  - `src/middleware.ts:195-216` archives non-launch APIs before CSRF evaluation, but `src/lib/__tests__/middleware-csrf.test.ts` still expects a `403` CSRF failure rather than the current `410` archive response.
  - `src/lib/python-internal/service.ts:61-73` defaults proxy traffic to `http://127.0.0.1:3000`, while `tests/lib/python-cv-proxy.test.ts` still expects `http://localhost/...`.
  - `src/app/app/i/expertise/components/edit-skill/VerificationSection.tsx:52-60` labels the CTA `Ask for confirmation`, while related UI tests still search for `Request Verification` or `Send request`.
- Why it matters:
  - These are not just stale archive tests. Some failures represent real contract drift on still-relevant surfaces.
- Next action:
  - Reconcile current intended behavior against the failing expectations and update either implementation or tests case-by-case.

### FS-04: Baseline privacy is healthy, but the extended privacy suite still contains one real integrity failure

- Status: Fact
- Severity: P1
- Type: Privacy and test-factory integrity
- Evidence:
  - `npm run test:privacy` passed `20/20`.
  - `npm run test:privacy:extended` failed `1/26`.
  - The failing extended case hit foreign key constraint `assignments_org_id_organizations_id_fk` while repairing a conversation-stage fixture.
- Why it matters:
  - This does not read like a broad RLS policy regression.
  - It does indicate fixture or factory drift inside a privacy-critical test path, which weakens confidence in the extended suite.
- Next action:
  - Repair the failing extended privacy fixture setup and re-run the extended suite before using it as a launch gate.

### FS-05: Cron ownership expectations have drifted

- Status: Fact
- Severity: P2
- Type: Scheduling and governance drift
- Evidence:
  - `scripts/lib/cron-job-org-config.mjs:78-112` still classifies `/api/cron/weekly-digest` as a legacy job to disable.
  - `tests/scripts/cron-scheduling.test.ts` expects a different current schedule classification.
- Why it matters:
  - Release automation depends on a single source of truth for what should run and what should be disabled.
- Next action:
  - Reconcile the cron registry, docs, and tests so scheduling ownership is explicit again.

### FS-06: Maintenance noise is accumulating around otherwise healthy gates

- Status: Fact
- Severity: P2
- Type: Operational hygiene
- Evidence:
  - `npm run build` passed but emitted stale browser mapping and `caniuse-lite` warnings.
  - Test runs repeatedly emitted `--localstorage-file` path warnings.
  - Multiple test flows emitted GoTrue client warnings.
  - `npm run lint` passed with one warning for raw `<img>` usage in `tests/ui/pilot-packaging-guardrails.test.tsx`.
- Why it matters:
  - None of these are launch blockers by themselves, but together they reduce signal quality and make true regressions harder to spot.
- Next action:
  - Clean up non-blocking operational noise after the test inventory and dependency issues are addressed.

## Verification Results

| Command                         | Result on 2026-04-16 | What it means                                             |
| ------------------------------- | -------------------- | --------------------------------------------------------- |
| `npm run lint`                  | Pass with 1 warning  | codebase clears lint, but one raw `<img>` warning remains |
| `npm run typecheck`             | Pass                 | TypeScript contracts compile                              |
| `npm run test`                  | Fail                 | default suite is red and includes stale/archived coverage |
| `npm run build`                 | Pass                 | production build can be produced                          |
| `npm run docs:freshness`        | Pass                 | docs freshness policy is healthy                          |
| `npm run db:drift-check`        | Pass                 | migration ledger discipline is intact                     |
| `npm run test:privacy`          | Pass                 | baseline privacy and RLS checks are healthy               |
| `npm run test:privacy:extended` | Fail                 | one extended privacy fixture/integrity issue remains      |
| `npm audit --omit=dev --json`   | Fail                 | production dependency vulnerabilities remain unresolved   |

## Additional Notes

### What the failing default suite currently contains

The current `npm run test` failure set is a mix of:

- archived or removed route/component imports
- live expectation drift on active behavior
- a few standalone test-contract failures not obviously tied to archived scope

Examples of the latter include:

- `tests/lib/assignment-publish-validation.test.ts`
- `tests/lib/canonical-skill-proof-write.test.ts`
- `tests/ui/dashboard-status-chip-style.test.tsx`
- `tests/ui/edit-skill-window-proofs.test.tsx`
- `tests/ui/impact-story-form.test.tsx`
- `tests/ui/profile-artifact-edit-actions.test.tsx`

### What this audit did not run

This audit did not run the broader launch-only or browser-heavy gates that may require additional environment setup or longer execution time, including:

- Playwright accessibility flows beyond the previously reviewed repo docs
- broader go/no-go launch gates
- performance budget enforcement
- full production-like smoke passes beyond the standard build/test commands above

## Recommended Next Steps

1. Remove archived and non-MVP tests from the default suite so `npm run test` becomes a trustworthy gate again.
2. Reconcile the remaining live failures by aligning tests and current intended behavior.
3. Upgrade the vulnerable production dependencies and re-run the full verification stack.
4. Repair the single failing extended privacy fixture and keep privacy suites as hard gates.
5. Clean up cron ownership drift and residual maintenance noise once the core release blockers are resolved.

## Bottom Line

The repository is buildable and the privacy and migration foundations are materially healthier than the current test signal suggests. Release readiness is still blocked today by stale test inventory, active contract drift, and production dependency vulnerabilities.

The fastest credible path forward is to restore trust in the default test suite first, then close the remaining live failures, then clear the dependency risk.
