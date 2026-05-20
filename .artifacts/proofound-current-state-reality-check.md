# Proofound Current-State Reality Check

Date: `2026-03-25`  
Workspace: `/Users/yuriibakurov/proofound`  
Authority: locked MVP stack only

> Historical/superseded freshness banner added 2026-05-14:
>
> - Do not treat this March current-state matrix as current launch, route, or MVP truth without checking newer evidence first.
> - The locked MVP definition remains `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`; this matrix cannot broaden it.
> - For narrow pilot-readiness evidence, prefer `project/changes/entries/2026-04-09__mvp-launch-audit-execution.md` or newer current evidence. That April 9 execution retired the March build/runtime, route breadth, launch smoke, and strict org corridor blockers unless those blockers are reproduced again in a fresh run.
> - For release-clean status, use `audit/full-scale-audit-2026-04-16.md` or newer release evidence; April 16 found the repo structurally healthy but not release-clean.

> Current evidence index added 2026-05-19, refreshed 2026-05-20:
>
> - Treat this March matrix as historical evidence only. The current surface matrix, findings, fixes, evidence, and remaining risks live in `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`.
> - The March `no non-MVP launch surface` `FAIL`, route-count blocker, stale-smoke claims, and local `/_document` blocker are not current truth unless reproduced by a fresh run.
> - Current verification truth is in `docs/verification-checklist.md`: the 2026-05-20 route-surface rerun keeps proof-first onboarding, Proof Pack canonicality, Proof Pack anchor integrity, bounded verification, blind review, consented reveal, assignment lifecycle, full org corridor, route-surface scope, and export/delete/auditability as `PASS`.
> - Current Phase 4 truth is partial: local full launch smoke and local monitor evidence passed, but production-candidate backup, restore, and go/no-go proof remain open.
> - Current non-blocking watch items are separate from launch gates: assignment publish/list latency requires live or staging budget proof, and any future stale-doc cleanup must point at current May 19 evidence before reusing March conclusions.

## Purpose

This matrix refreshes current-state launch truth from fresh repo evidence. Older audits remain historical evidence only and do not receive current-block credit.

## Evidence Commands Used In This Pass

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run docs:freshness`
- `npm run test -- tests/api/launch-surface-inventory.test.ts tests/api/launch-page-inventory.test.ts src/lib/launch/__tests__/surface-policy.test.ts src/app/api/monitoring/__tests__/launch-status-route.test.ts`
- `npm run test -- tests/api/verification-status-route.test.ts tests/ui/verification-status-options.test.tsx tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts tests/api/decisions-route.test.ts tests/api/engagement-verifications-route.test.ts tests/lib/authz-policy.test.ts tests/lib/workflow-decision-record.test.ts`
- `npm run test:privacy`
- `npm run test:privacy:extended`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false node ./scripts/playwright-node20.mjs test e2e/strict/org-corridor.strict.spec.ts --project=chromium --reporter=line --workers=1`
- `PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:org:strict`
- `npm run test:e2e:landing`
- `npm run test:e2e:landing:visual`
- `BASE_URL=https://proofound.io npm run test:launch:smoke`
- `npm run monitor:launch` against the configured site URL
- `find src/app/api -name 'route.ts' | wc -l`
- `find src/app -name 'page.tsx' | wc -l`
- `node <<'NODE' ... classifyLaunchApiPath/classifyLaunchPagePath ... NODE`

## Matrix

| Requirement                                                                           | Status | Severity | Fresh current-block evidence                                                                                                                                                                                                                                                                                                                                                                | Notes                                                                                                     |
| ------------------------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| proof-first onboarding                                                                | `PASS` | `P2`     | 2026-05-19 current rerun passed onboarding, setup, canonical proof write, readiness, and private-context scaffolding tests; Browser mock-auth check rendered the proof-first onboarding flow.                                                                                                                                                                                               | Current verification-checklist evidence supersedes this March row.                                        |
| Proof Pack canonicality                                                               | `PASS` | `P1`     | Focused verification status, verification options UI, decision, engagement verification, and workflow decision packs all passed.                                                                                                                                                                                                                                                            | Active verification status now resolves through the canonical contract without user-visible legacy drift. |
| Proof Pack anchor integrity                                                           | `PASS` | `P2`     | 2026-05-19 current rerun passed proof-pack anchor, canonical proof write, readiness, export, onboarding, and verification-integrity tests; the hardening migration still enforces primary anchors.                                                                                                                                                                                          | Current verification-checklist evidence supersedes this March row.                                        |
| bounded verification semantics                                                        | `PASS` | `P1`     | `tests/api/verification-status-route.test.ts` and `tests/ui/verification-status-options.test.tsx` passed.                                                                                                                                                                                                                                                                                   | `/api/verification/status` remains the canonical user-facing source.                                      |
| canonical role and RLS truth                                                          | `PASS` | `P1`     | `tests/lib/authz-policy.test.ts`, `npm run test:privacy`, and `npm run test:privacy:extended` all passed against the configured Supabase target.                                                                                                                                                                                                                                            | Runtime authz and real-DB privacy suites are aligned in this pass.                                        |
| blind-by-default review                                                               | `PASS` | `P1`     | `tests/api/org-match-review-route.test.ts` passed, and the strict corridor rerun stayed green.                                                                                                                                                                                                                                                                                              | Fresh evidence now covers both focused route semantics and end-to-end corridor behavior.                  |
| candidate-consented reveal                                                            | `PASS` | `P1`     | `tests/api/conversation-reveal-route.test.ts` passed, and the strict corridor rerun reached reveal approval and identity unlock.                                                                                                                                                                                                                                                            | Reveal consent is freshly rerun, not inferred from older audits.                                          |
| assignment create / edit / publish                                                    | `PASS` | `P1`     | `PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:org:strict` passed `7/7`, including the narrowed org assignment lifecycle checks.                                                                                                                                                                                                                                                             | Fresh build/runtime evidence replaces the stale `/_document` blocker story.                               |
| review -> intro -> reveal -> interview -> decision -> hire -> engagement verification | `PASS` | `P0`     | Isolated strict corridor rerun passed `1/1`, full org strict rerun passed `7/7`, and live smoke passed the `full_org_corridor_review_to_engagement_verification` scenario.                                                                                                                                                                                                                  | The hiring corridor is freshly green in this pass.                                                        |
| no non-MVP launch surface                                                             | `PASS` | `P0`     | 2026-05-20 `npm run test:launch:routes` passed 4 files / 27 tests. Current source inventory reports `140` compiled API route handlers and `51` compiled pages. API policy: `108` active MVP, `16` internal launch ops, `16` archived compatibility handlers. Page policy: `48` active launch, `3` internal launch ops, and `/dev/resolve-home` explicit archived/fail-closed compatibility. | Current route inventory supersedes the March route-breadth blocker.                                       |
| export / delete and auditability                                                      | `PASS` | `P2`     | 2026-05-19 current rerun passed public/authenticated portfolio export, org export, user export, immediate account deletion, retired deletion-cron behavior, org-owner audit export, admin break-glass audit read, and privacy overview/audit-log UI tests.                                                                                                                                  | Current verification-checklist evidence supersedes this March row.                                        |
| launch ops / smoke freshness / launch-status truth                                    | `PASS` | `P0`     | Launch-status route tests passed, `.artifacts/launch-smoke-report.json` refreshed at `2026-03-25T08:00:27.400Z` with `overallStatus: pass`, and live synthetic monitors passed `10/10` at `2026-03-25T08:00:31.808Z`.                                                                                                                                                                       | The old stale-smoke blocker is retired.                                                                   |

## Stale Claims To Retire Now

- `The persisted smoke artifact is stale and still blocking launch readiness.`
  - Retire this as current truth. The smoke artifact was refreshed at `2026-03-25T08:00:27.400Z` and expires at `2026-03-25T09:00:27.400Z`.
- `No safe strict org-corridor rerun was attempted in this block.`
  - Retire this as current truth. Fresh isolated and full org strict reruns both passed in prod mode.
- `The active route surface is still 187 APIs and 91 pages.`
  - Retire this as current truth. Fresh current-state counts are `140` compiled API route handlers and `51` compiled pages.
- `The org settings surface remains a live gate page.`
  - Retire this as current truth. `/app/o/[slug]/settings` is now archived and returns the launch-archive not-found copy.
- `The contracts API remains a live launch surface.`
  - Retire this as current truth. `/api/contracts` is archived and returns `410`.
- `Google, LinkedIn, and video integrations remain live launch compatibility flows.`
  - Retire this as current truth. Those non-launch integration routes are now removed from the active launch surface, and interview scheduling is manual-link only in the active MVP UI.

## Changed Evidence Since The Prior Snapshot

- `npm run lint`, `npm run typecheck`, and `npm run build` all passed in the current workspace.
- The focused launch, verification, review, reveal, decision, and engagement packs all passed.
- Real-DB privacy proof is green again:
  - `npm run test:privacy` -> `PASS`
  - `npm run test:privacy:extended` -> `PASS`
- The strict org corridor is freshly green:
  - isolated corridor rerun -> `1 passed (3.4m)`
  - full org strict bundle -> `7 passed (5.7m)`
- The narrowed public launch story is freshly green:
  - `npm run test:e2e:landing` -> `10 passed (19.9s)`
  - `npm run test:e2e:landing:visual` -> `1 passed (15.8s)`
- `.artifacts/launch-smoke-report.json` is now a fresh pass artifact again.
- Live synthetic monitor evidence is fresh and healthy across all ten monitors.
- The non-launch Google, LinkedIn, and video integration slice is no longer part of the active launch surface:
  - related API routes are archived or removed from classification
  - settings and verification UI now present manual-only or read-only compatibility states
- The March route-breadth blocker is superseded by the 2026-05-20 route inventory pass. Full launch readiness still depends on production-candidate backup, isolated restore, authenticated launch-status/perf-status, and final go/no-go evidence for the intended target.
