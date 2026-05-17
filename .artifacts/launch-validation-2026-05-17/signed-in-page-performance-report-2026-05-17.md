# Signed-In Page Performance Report - 2026-05-17

## Scope

Optimized signed-in Proofound page loading for the individual profile flow and organization user flows tested locally with the Codex in-app Browser.

Routes measured:

- Individual: `/app/i/profile`
- Organization messages: `/app/o/test-org/messages`
- Organization assignment builder: `/app/o/test-org/assignments/new`

## Diagnosis

- The individual profile route had already been improved by deferring the heavy profile editor, but the full profile server action could still take multiple seconds in the background and the visible readiness shell was delayed by client-side shell fetching.
- The organization messages and assignment builder routes were dominated by heavy client bundles on initial load.
- The app tour provider and auth/persona resolution were repeat work on app route shells.

## Changes Made

- Added a lean individual profile shell server action and collapsed its page-readiness data into one SQL round trip.
- Changed `/app/i/profile` default loading to send the lean readiness shell from the server, with the full profile refreshing in the background.
- Added a tiny readiness preview while the full editable profile bundle loads, so users see the real readiness surface sooner.
- Kept `?profileView=full` on the full profile path so deep links to tabs/proof flows still load the complete editor.
- Made background full-profile refresh non-destructive if it fails after a valid shell is already visible.
- Deferred heavy organization messages and assignment-builder clients.
- Moved org messages persona resolution to the server and passed `currentUserId` into the client.
- Passed org assignment `slug` from the server page instead of resolving route params inside the heavy client.
- Added a one-shot guard to the deferred tour provider import.
- Kept the no-database in-memory mock path compatible with the new shell query by adding an empty `db.execute` stub.
- Tightened the mobile E2E org profile heading assertion to avoid a duplicate-heading false failure.

## Browser Measurements

Local mock servers:

- Individual mock app: `http://127.0.0.1:33445`
- Organization mock app: `http://127.0.0.1:33444`

Fresh Browser measurements filter console errors by route-load start time.

| Route                             | Earlier observed readiness | Final warm readiness | Fresh console errors |
| --------------------------------- | -------------------------: | -------------------: | -------------------: |
| `/app/i/profile`                  |                    2843 ms |               606 ms |                    0 |
| `/app/o/test-org/messages`        |                    1084 ms |               913 ms |                    0 |
| `/app/o/test-org/assignments/new` |                    1080 ms |              1040 ms |                    0 |

The individual profile route also previously showed full profile background action samples in the 4.5-6.2s range during diagnosis; the default visible route no longer waits on that full payload.

## Verification

Passed:

- `npm run typecheck`
- `npm run lint`
- `npm run test -- tests/ui/editable-profile-purpose-gating.test.tsx tests/routes/organization-messages-page.test.tsx tests/routes/portfolio-shortcuts.test.tsx tests/lib/auth-request-cache.test.ts`
- `npm run test:e2e:mobile:org` - 9 passed, 1 individual-only test skipped
- `npm run test:e2e:mobile:individual` - 9 passed, 1 org-only test skipped
- Codex in-app Browser route timing pass for all three scoped signed-in routes

Notes:

- Vitest reports a sandbox-only WebSocket bind warning on `0.0.0.0:24678`, but the focused test suite passed.
- Playwright mobile smoke runs need an unsandboxed local port bind in this environment.
- The repo `perf:budgets` script targets the public homepage and `/api/health`, so it was not used as evidence for this signed-in page task.

## Remaining Risk

- Measurements are local mock/dev measurements. Production should still be checked after deployment against real Supabase latency.
- The full profile editor can still be slower when explicitly opened with `?profileView=full`; the default profile route now avoids blocking first useful paint on that heavier payload.
