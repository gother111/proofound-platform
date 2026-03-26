# Block 3 Report

> Superseded note added 2026-03-25:
> - This file is preserved as historical evidence only and does not override the locked MVP stack or newer `.artifacts/*` current-state evidence.
> - Stale categories in or around this report: mixed live verification transport conclusions, any `PageNotFoundError: /_document` build-blocker claims, any `pilot-launchable` or similar launch verdict treated as current truth, and older route-surface claims where newer route inventory disagrees.
> - Current repo truth differs: `npm run build` and `npm run typecheck` now pass under Node `20.20.0`, fresh strict org-corridor evidence is not green today, and route breadth remains an open launch risk.

## Objective

Reduce the latency and brittleness of the organization corridor so shortlist generation, reveal flow support, and interview scheduling run materially faster and the tested runtime path is stable enough for launch confidence.

## Commands run

- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-08..O-12|O-13..O-16"`
- `npm run dev -- -p 33100`
- `curl http://127.0.0.1:33100/api/monitoring/launch-status`
- `curl http://127.0.0.1:33100/api/monitoring/perf-status`
- `SUS_STUDY_COMPLETE=true GO_NO_GO_RUN_SYNTHETICS=0 BASE_URL=http://127.0.0.1:33100 npm run go:no-go`
- `npx tsx --eval "(async () => { ... computeAssignmentMatches ... })()"`
- `npm run test -- src/lib/__tests__/matching-eligibility.test.ts`
- `npm run test -- tests/api/interviews-schedule-route.test.ts`
- `node run-migrations.mjs`
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1`
- `npm run typecheck`
- `npm run test -- src/lib/__tests__/matching-eligibility.test.ts tests/lib/individual-readiness-state.test.ts`
- `npm run log:session`
- `npm run log:change`

## Files changed

- `docs/codex-progress.md`
- `docs/block-3-report.md`
- `src/lib/readiness/individual-state.ts`
- `src/lib/matching/eligibility.ts`
- `src/lib/core/matching/assignmentMatcher.ts`
- `src/app/api/interviews/schedule/route.ts`
- `src/db/schema.ts`
- `src/db/migrations/20260313185000_add_interview_hot_path_indexes.sql`
- `src/lib/__tests__/matching-eligibility.test.ts`
- `tests/api/interviews-schedule-route.test.ts`
- `agent/scratchpad/entries/2026-03-13T18-04-13Z__master__4767ea77.md`
- `project/changes/entries/2026-03-13T18-04-13Z__master__4767ea77.md`

## Tests run

- `npm run test -- src/lib/__tests__/matching-eligibility.test.ts`
  - PASS
- `npm run test -- tests/api/interviews-schedule-route.test.ts`
  - PASS
- `node run-migrations.mjs`
  - PASS, applied `20260313185000_add_interview_hot_path_indexes`
- Direct benchmark before change
  - `computeAssignmentMatches()` about `76480ms` on assignment `aaaa1111-2222-4333-8444-aaaaaaaaaa01`, `poolSize=185`
- Direct benchmark after change
  - `computeAssignmentMatches()` about `5088ms` on the same assignment
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-08..O-12|O-13..O-16"`
  - PASS before fix in `3.7m`
  - PASS after fix in `2.0m`
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1`
  - PASS, `6/6` in `4.8m`
- `npm run typecheck`
  - PASS
- `npm run test -- src/lib/__tests__/matching-eligibility.test.ts tests/lib/individual-readiness-state.test.ts`
  - PASS, `8/8`

## Result

PASS

Fresh evidence shows the shortlist bottleneck dropped from about `76.5s` to about `5.1s`, the focused org corridor dropped from `3.7m` to `2.0m`, and the full strict org suite passed in `4.8m`. Live dev-server traces showed `/api/match/assignment` finishing in about `14.1s` end-to-end with the matcher itself at about `7.0s`, and `/api/interviews/schedule` returning after about `3.3s` of critical work while workflow and messaging completed asynchronously after the response. No server restart or memory-threshold crash was observed in the tested path.

## Remaining blockers

- Live launch-status and `npm run go:no-go` remain blocked by a stale smoke artifact. This is truthful gate behavior, not a regression from the Block 3 changes.
- Proof Pack anchor nullability and mixed verification semantics remain outside this block and are still open drift items.

## Exact next recommended action

Rerun launch smoke to refresh the local smoke artifact, confirm `/api/monitoring/launch-status` and `npm run go:no-go` can turn green with fresh evidence, then start the next narrow block on Proof Pack anchor enforcement and verification semantics cleanup.
