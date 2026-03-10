# Proofound Remaining Work Against Canonical MVP Docs

## 1. Launch Blockers First

| Title                                                                           | Why it matters                                                                                                                  | Exact gap                                                                                                                                              | Affected code paths                                                                                                                                          | Recommended implementation steps                                                                                                                                                                                                                                                               | Dependency / risk                                                                  | Suggested owner type |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------- |
| Reconcile org roles and membership states with canonical model                  | Canonical permissions, invite flows, review scope, ownership transfer, and audit semantics all depend on the right actor model. | Repo uses `owner/admin/member/viewer` instead of canonical `org_owner/org_manager/org_reviewer`, and active-state semantics are not fully represented. | `src/lib/authz/policy.ts`, `src/actions/org.ts`, `src/lib/auth/admin.ts`, `src/db/policies.sql`, org pages under `src/app/app/o/[slug]/*`                    | 1. Define canonical enum and migration plan. 2. Update membership schema, authz matrix, and server checks. 3. Add explicit ownership-transfer flow. 4. Update RLS and tests. 5. Re-run org smoke matrix.                                                                                       | High blast radius across DB, APIs, UI, and existing fixtures.                      | full-stack           |
| Reconcile RLS with deny-by-default privacy contract                             | Launch privacy cannot be claimed while broad table reads remain allowed beneath app logic.                                      | `profiles` and related legacy policies still allow access patterns that are hard to reconcile with canonical visibility ceilings.                      | `src/db/policies.sql`, `tests/privacy/rls-policies.test.ts`, `tests/privacy/rls-policies-extended.test.ts`                                                   | 1. Inventory all canonical objects needing RLS. 2. Replace broad allow policies with ownership, membership, and workflow-aware checks. 3. Add canonical-policy regression tests per table. 4. Produce updated RLS deployment summary.                                                          | High risk of breaking existing flows if changed without route-by-route validation. | backend              |
| Fix upload contract drift and formalize AV fallback                             | Upload security is a launch-blocking control in the master PRD and runbook.                                                     | Current ingest logic uses 10 MB caps, allows Word docs and HEIF/HEIC, excludes canonical text/plain and markdown, and has no real AV scan integration. | `src/lib/uploads/lifecycle.ts`, upload endpoints using it, public portfolio proof attach flows                                                               | 1. Align allowlist and size caps with canonical docs. 2. Remove unsupported file types. 3. Add explicit validator audit events for fallback-only AV posture or wire real AV scanning. 4. Add upload contract tests.                                                                            | Medium risk to existing uploads and seeded fixtures.                               | backend              |
| Bring interview scheduling into canonical provider scope                        | The master PRD explicitly narrows in-scope scheduling providers.                                                                | Zoom is implemented as a live scheduling path even though only Google Meet and manual links are in scope.                                              | `src/app/api/interviews/schedule/route.ts`, `src/app/actions/interviews.ts`, `src/app/api/integrations/video/route.ts`, interview UI components              | 1. Remove or gate live Zoom scheduling. 2. Keep manual link fallback explicit. 3. Update provider UI copy and tests. 4. Verify interview lifecycle notifications and decision follow-up.                                                                                                       | Medium risk to current provider integrations and tests.                            | full-stack           |
| Replace TODO-grade “why not shortlisted” and related decision-support shortcuts | User trust is damaged if explanation surfaces appear precise but are backed by simplified heuristics.                           | Verification, availability, and location checks in why-not-shortlisted are stubbed or generic.                                                         | `src/app/api/feedback/why-not-shortlisted/route.ts`                                                                                                          | 1. Hook into actual verification records and readiness data. 2. Use canonical availability and location logic. 3. Add tests covering meaningful explanation outputs.                                                                                                                           | Medium product risk, low infra risk.                                               | backend              |
| Strengthen synthetic monitors, smoke tests, and launch verification             | Runbook Sections 2, 5, 6, and 7 treat these as launch requirements, not optional docs.                                          | Current smoke suite is weak and partly wrong. Synthetic-monitor evidence is partial. Restore-drill proof is not implemented in repo code.              | `tests/e2e/smoke.spec.ts`, `src/app/api/cron/health-check/route.ts`, `src/app/api/admin/metrics/rollout/route.ts`, `scripts/go-no-go-check.mjs`, CI workflow | 1. Replace smoke suite with canonical flow checks: auth, token redemption, shortlist/fallback, portfolio render, export, delete, rollback-safe health. 2. Add monitor runs for each runbook-critical path. 3. Add restore-drill evidence process or scripted verification artifact generation. | High operational risk if left incomplete.                                          | infra/devops         |
| Tighten privacy helper and token-validation shortcuts                           | A single legacy shortcut can bypass otherwise-correct higher-level privacy controls.                                            | `validateProfileLinkToken()` in privacy helper is placeholder logic; mixed privacy fetchers make enforcement inconsistent.                             | `src/lib/privacy/profile-fetcher.ts`, any caller surfaces, public snippet/profile token paths                                                                | 1. Replace placeholder token logic with capability-token validation. 2. De-duplicate legacy privacy helpers. 3. Add route-level tests for matched-org, link-only, and owner-only permutations.                                                                                                 | Medium risk due to hidden legacy consumers.                                        | security/privacy     |

## 2. Non-Blocking But Important Follow-Ups

| Item                                            | Why it matters                                                                  | Exact gap                                                                           | Affected code paths                                                             | Suggested owner type |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| Tighten dashboard and next-best-action logic    | UI exists, but readiness/NBA confidence is uneven.                              | Placeholder checks remain in dashboard layout/readiness logic.                      | `src/lib/dashboard/layout.ts`, dashboard components and tests                   | frontend             |
| Complete export/import symmetry                 | Export is strong, import is narrow.                                             | Import does not restore the full canonical proof-pack and lifecycle object set.     | `src/app/api/user/export/route.ts`, `src/app/api/user/import/route.ts`          | backend              |
| Strengthen job idempotency and queue visibility | Canonical appendix expects retries, ownership, and terminal-failure visibility. | Queue-style tables exist, but ownership and DLQ proof are not consistently visible. | cron routes, workflow service, matching refresh queue, lifecycle reconciliation | backend              |
| Improve accessibility evidence in CI            | Audit artifacts exist, but launch proof should be more automatic.               | A11y tests are not clearly aligned to the full canonical smoke matrix.              | `tests/a11y/*`, `.github/workflows/ci.yml`                                      | frontend             |
| Rationalize oversized org/admin surfaces        | They inflate perceived completeness and complicate launch focus.                | Repo contains many non-canonical org operating-system pages.                        | `src/app/app/o/[slug]/*`, admin pages                                           | product/design       |
| Decide fate of LinkedIn import                  | Route exists but is placeholder only.                                           | Either remove from MVP UI or implement properly later.                              | `src/app/api/expertise/linkedin-import/route.ts`, related UI                    | product/design       |

## 3. Explicit Out-of-Scope Items

These should not be counted as missing for MVP launch:

- Public candidate directory, browse-all-talent surface, crawlable taxonomy archive, or recommendation graph.
- Broad org operating-system surfaces such as org maps, project libraries, donor reporting, investor reporting, and heavy enterprise admin suites.
- Sponsor actor, bounty corridor, reviewer-network incubation, university first-proof corridor, and employer pilot corridor.
- Expanded Zen, local-resource, coaching, therapy-style, burnout-management, or reminder-loop behavior beyond optional private check-ins and reflections.
- Embedded video rooms in conversations, Redis-based launch architecture, GraphQL launch surface, Datadog-style broader monitoring stack, and Swedish runtime parity.
- Video portfolios and public collections/directories.

## 4. Suggested Implementation Order

### Now

- Canonical org role and membership migration.
- RLS and deny-by-default reconciliation.
- Upload contract and AV fallback alignment.
- Interview provider scope correction.
- Replace weak smoke tests and fill launch-monitor gaps.

### Next

- Privacy helper cleanup and token-validation hardening.
- Why-not-shortlisted logic completion.
- Export/import symmetry improvements.
- Queue and retry observability hardening.

### Later

- Rationalize oversized org/admin surfaces.
- Decide whether LinkedIn import remains hidden, removed, or upgraded.
- Post-launch corridors only after launch-safe MVP evidence is complete.

## 5. Suggested Owner Type

| Owner type       | Best-fit remaining work                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| frontend         | Dashboard/NBA polish, accessibility hardening, UI de-scoping of non-canonical surfaces           |
| backend          | RLS, upload pipeline, import/export symmetry, jobs and retries, interview provider enforcement   |
| full-stack       | Org role migration, invite flows, interview and feedback lifecycle completion                    |
| product/design   | Scope cleanup for oversized org surfaces, post-MVP corridor separation, LinkedIn import decision |
| data/analytics   | Launch monitor event quality, rollout metrics, feedback SLA instrumentation                      |
| infra/devops     | Synthetic monitors, smoke automation, restore-drill evidence, rollback verification              |
| security/privacy | Capability-token cleanup, privacy helper consolidation, log and PII exclusion review             |
