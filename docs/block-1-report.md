# Block 1 Report

## objective

Fix the organization publish corridor so the strict launch path from org creation through internal review to assignment publish works end to end without seeded publish workarounds.

## commands run

- `npm run test -- tests/api/assignments-publish-route.test.ts tests/lib/assignment-publish-validation.test.ts`
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-05..O-07|O-07b"`
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-05..O-07|O-07b"`
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-05..O-07|O-07b"`
- `npm run test -- tests/api/assignments-publish-route.test.ts`
- `npm run test -- tests/lib/assignment-publish-validation.test.ts`
- `npm run test -- tests/api/assignments-publish-route.test.ts tests/lib/assignment-publish-validation.test.ts`
- `npm run test:e2e:org:strict`

## files changed

- `src/app/api/assignments/[id]/publish/route.ts`
- `tests/api/assignments-publish-route.test.ts`
- `e2e/strict/organization.strict.spec.ts`
- `docs/codex-progress.md`
- `docs/block-1-report.md`

## tests run

- `npm run test -- tests/api/assignments-publish-route.test.ts tests/lib/assignment-publish-validation.test.ts` -> PASS before edits, used as focused baseline
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-05..O-07|O-07b"` -> PASS but stale evidence because the old strict spec still accepted `403`
- `npm run test -- tests/api/assignments-publish-route.test.ts` -> PASS after adding the internal-review guard and keeping owner-manager publish authority
- `npm run test -- tests/lib/assignment-publish-validation.test.ts` -> PASS after the route change
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-05..O-07|O-07b"` -> FAIL at first with publish request timeout at 30000ms
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-05..O-07|O-07b"` -> FAIL next with overall 120000ms test timeout while publish waited on slow post-publish side effects
- `npm run test -- tests/api/assignments-publish-route.test.ts tests/lib/assignment-publish-validation.test.ts` -> PASS after making publish-side activation fire-and-forget
- `node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 --grep "O-05..O-07|O-07b"` -> PASS after widening the strict publish request timeout and correcting the stale UI assertion
- `npm run test:e2e:org:strict` -> PASS, 6 passed in 6.2m

## result

PASS

## remaining blockers

- `launch-status` stale-smoke false-green remains the next launch blocker and was not addressed in this block.
- The organization suite still requires widened timeouts and logged one recovered `database.health.timeout.recovered` warning, so runtime latency remains a high-risk follow-up even though the suite passed.
- P1 and P2 drift from the audit remain open: Proof Pack anchor nullability, mixed verification semantics, and non-MVP API surface cleanup.

## root cause and fix

- Root cause 1: the strict org publish runtime posted `{}` to `/api/assignments/:id/publish`, but the backend intentionally requires explicit `principalContext` for this sensitive mutation route, so the strict flow could hit `403` before any publish-authority or readiness logic.
- Root cause 2: the strict org publish tests were permissive enough to accept `400` and `403`, so they could pass while the canonical publish corridor was still broken.
- Root cause 3: the publish route allowed direct publish from non-review states, even though the assignment workflow contract requires internal review before publish.
- Root cause 4: the publish route was waiting on slow activation side effects, including post-publish matching and notifications, which caused strict runtime timeouts even after the `403` blocker was removed.
- Fix: kept explicit organization principal enforcement, updated the strict runtime to send that context, required `pending_review` or `ready_to_publish` before publish, tightened the strict org flow to create real publishable assignments, and made post-publish activation side effects fire-and-forget so the publish request returns promptly.

## exact next recommended action

Run Block 2: make `launch-status` fail or degrade when smoke evidence is stale, rerun launch monitors, and then update `docs/codex-progress.md` plus the next block report with fresh evidence.
