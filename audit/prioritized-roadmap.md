# Prioritized Roadmap

Audit snapshot: `2026-03-05`

## Prioritization Principles

- Fix release blockers before doing structural cleanup.
- Prefer unifying existing patterns over introducing new ones.
- Separate documentation repair from architectural refactors so release confidence improves immediately.

## Sprint 0: Release Stabilization

| Item                                                                                       | Severity | Effort | Owner             | Dependency                   | Exit Criteria                                                                  |
| ------------------------------------------------------------------------------------------ | -------- | ------ | ----------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| Fix CV import fallback regression behind `tests/lib/cv-import-suggest.test.ts`             | P1       | M      | Backend           | none                         | `npm run test` passes                                                          |
| Fail closed on missing cron secrets for `refresh-matches` and normalize cron auth behavior | P1       | S      | Backend/Platform  | none                         | unauthenticated/misconfigured cron requests return 401 or 500 consistently     |
| Update active docs for current cron, a11y, QA, and CI reality                              | P1       | S      | Platform/Docs     | none                         | README, active docs, and verification docs stop contradicting current behavior |
| Remove unsupported `Permissions-Policy` directives and consolidate header ownership        | P1       | M      | Platform/Security | none                         | browser warnings disappear and one header source of truth exists               |
| Re-baseline `test:a11y` on deterministic server startup                                    | P1       | M      | Frontend/QA       | Node 20 enforcement decision | a11y failures represent product issues, not startup timeouts                   |

## Sprint 1: Correctness and Documentation Alignment

| Item                                                                               | Severity | Effort | Owner             | Dependency           | Exit Criteria                                                      |
| ---------------------------------------------------------------------------------- | -------- | ------ | ----------------- | -------------------- | ------------------------------------------------------------------ |
| Publish one canonical cron inventory with route, schedule, auth, and owner         | P1       | S      | Platform          | Sprint 0 doc updates | all active cron docs point to one source of truth                  |
| Make Node 20 enforcement consistent across local verification and release commands | P2       | S      | Platform          | none                 | primary scripts and docs no longer diverge on runtime expectations |
| Reduce public `/api/health` detail to a safer public contract                      | P2       | S      | Platform/Security | none                 | endpoint remains useful without advertising config state           |
| Decide whether mock DB fallback remains supported outside explicit dev mode        | P1       | M      | Platform          | none                 | environment model is documented and enforced                       |
| Align CI workflow and verification checklist                                       | P1       | S      | Platform          | none                 | checklist describes actual enforced gates                          |

## Sprint 2: UX, Accessibility, and Performance Cleanup

| Item                                                                    | Severity | Effort | Owner             | Dependency     | Exit Criteria                                                |
| ----------------------------------------------------------------------- | -------- | ------ | ----------------- | -------------- | ------------------------------------------------------------ |
| Remove cookie banner from critical auth routes or defer it safely       | P1       | S      | Frontend          | none           | login/signup no longer receive delayed consent overlay       |
| Fix duplicate accessible names in landing footer animation              | P1       | S      | Frontend          | none           | footer links have single accessible names                    |
| Replace landing raw `<img>` usage with supported image path             | P2       | S      | Frontend          | none           | lint warnings clear                                          |
| Split or defer heavy profile and zen bundles                            | P1       | M      | Frontend          | profiling pass | route bundles trend materially downward                      |
| Tighten perf budgets from "non-catastrophic" to user-centric thresholds | P2       | S      | Frontend/Platform | bundle review  | perf gate reflects desired UX, not just worst-case tolerance |

## Sprint 3: Structural Simplification

| Item                                                                               | Severity | Effort | Owner                  | Dependency           | Exit Criteria                                                |
| ---------------------------------------------------------------------------------- | -------- | ------ | ---------------------- | -------------------- | ------------------------------------------------------------ |
| Rationalize matching namespaces and route aliases                                  | P2       | L      | Backend/Product        | Sprint 0 stability   | one canonical matching route family exists                   |
| Separate bundled background jobs where scheduler limits no longer justify coupling | P2       | M      | Platform               | cron inventory       | notification, digest, and health work have clearer ownership |
| Archive or demote stale operational docs that no longer describe deployed behavior | P2       | M      | Docs/Platform          | Sprint 1 doc updates | active docs become short, current, and non-conflicting       |
| Establish subsystem ownership map for admin, matching, analytics, and cron         | P2       | M      | Engineering leadership | namespace decisions  | new work lands in named canonical boundaries                 |

## Quickest Wins

1. Make `refresh-matches` fail closed when `CRON_SECRET` is missing.
2. Delete unsupported `Permissions-Policy` directives.
3. Update `docs/ACCESSIBILITY.md` to reflect the actual test state.
4. Update `docs/qa/summary.md` to stop presenting the older pass state as current.
5. Remove legacy deletion cron schedules from README and cron docs.
6. Use `noopener,noreferrer` on the existing `window.open` flows.
7. Hide duplicate footer animation text from the accessibility tree.
8. Replace landing raw `<img>` usages.
9. Make `/api/health` less chatty.
10. Align `agent/checklists/verification.md` with `.github/workflows/ci.yml`.
