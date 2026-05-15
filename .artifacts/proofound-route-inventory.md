# Proofound Route Inventory

Generated: 2026-05-14
Workspace: `/Users/yuriibakurov/proofound`

> Historical/superseded freshness banner added 2026-05-14:
>
> - Do not treat this March route inventory as current route-surface truth without checking newer compiled inventory, tests, and launch evidence first.
> - The locked MVP definition remains `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`; this snapshot cannot broaden the launch corridor.
> - For narrow pilot-readiness evidence, prefer `project/changes/entries/2026-04-09__mvp-launch-audit-execution.md` or newer current evidence. That April 9 execution retired the March build/runtime, route breadth, launch smoke, and strict org corridor blockers unless those blockers are reproduced again in a fresh run.
> - For release-clean status, use `audit/full-scale-audit-2026-04-16.md` or newer release evidence; April 16 found the repo structurally healthy but not release-clean.

## Purpose

This is a code-grounded route-surface snapshot for the current workspace. It is an execution lens only, not product authority.

## Evidence Commands

- `find src/app/api -name 'route.ts' | wc -l`
- `find src/app -name 'page.tsx' | wc -l`
- `node <<'NODE' ... classifyLaunchApiPath/classifyLaunchPagePath ... NODE`
- `node <<'NODE' ... globSync('src/app/api/**/route.ts') ... NODE`
- `npm run build`
- `npm run test -- tests/api/launch-surface-inventory.test.ts tests/api/launch-page-inventory.test.ts src/lib/launch/__tests__/surface-policy.test.ts src/app/api/monitoring/__tests__/launch-status-route.test.ts`
- `PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:org:strict`
- `BASE_URL=https://proofound.io npm run test:launch:smoke`

## Current Counts

- API route handlers under `src/app/api/**`: `138`
- App page routes under `src/app/**/page.tsx`: `49`
- Launch-surface classification from `src/lib/launch/surface-policy.ts`:
  - API routes: `109` active launch, `16` internal-only launch ops, `13` archived compiled compatibility handlers
  - Page routes: `46` active launch, `3` internal-only launch ops, `0` archived compiled page handlers
- Cross-check:
  - filesystem counts and focused launch inventory tests match the reduced current workspace

## Highest-Volume API Families

| Family          | Count |
| --------------- | ----: |
| `verification`  |    12 |
| `user`          |    11 |
| `ai`            |    11 |
| `expertise`     |    10 |
| `cron`          |    10 |
| `match`         |     9 |
| `organizations` |     8 |
| `portfolio`     |     6 |
| `assignments`   |     6 |
| `interviews`    |     6 |
| `admin`         |     5 |
| `upload`        |     4 |

## Launch-Critical Route Families

These are the narrowest current routes that still matter most for the locked MVP corridor:

- `src/app/api/health/route.ts`
- `src/app/api/monitoring/launch-status/route.ts`
- `src/app/api/verify/[token]/route.ts`
- `src/app/api/verification/status/route.ts`
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
- `src/app/api/decisions/route.ts`
- `src/app/api/engagement-verifications/[id]/route.ts`
- `src/app/api/interviews/schedule/route.ts`
- `src/app/portfolio/[handle]/page.tsx`
- `src/app/portfolio/org/[slug]/page.tsx`
- `src/app/verify/[token]/page.tsx`

## Route-Surface Truth For This Pass

- The stale `187` API / `91` page claims are retired. Fresh current-state counts are `138` APIs and `49` pages.
- Fresh protected corridor evidence is now green:
  - isolated strict corridor rerun: `1 passed (3.4m)`
  - full org strict bundle: `7 passed (5.7m)`
- Fresh smoke evidence is now green again:
  - `.artifacts/launch-smoke-report.json` refreshed at `2026-03-25T08:00:27.400Z`
  - `overallStatus: "pass"`
  - live synthetic monitors passed `10/10` at `2026-03-25T08:00:31.808Z`
- The remaining route-surface blocker is breadth, not stale smoke or missing corridor evidence.
- Internal-only launch ops remain concentrated in admin verification/audit surfaces and cron launch-ops endpoints.

## Representative Archived Scope

The current workspace now hard-gates or archives representative excluded surfaces instead of treating them as live launch features:

- archived APIs:
  - `/api/contracts`
  - `/api/auth/google/callback`
  - `/api/auth/linkedin*`
  - `/api/integrations/google/*`
  - `/api/integrations/video*`
  - `/api/messages`
  - `/api/notifications`
  - `/api/moderation/*`
  - `/api/feedback/why-not-shortlisted`
  - `/api/verification/linkedin/initiate`
  - `/api/verification/veriff/*`
  - `/api/organizations/[orgId]/goals*`
  - `/api/organizations/[orgId]/ownership*`
  - `/api/organizations/[orgId]/partnerships*`
  - `/api/user/import`
- archived pages:
  - `/about`
  - `/contact`
  - `/support`
  - `/fairness`
  - `/app/o/[slug]/settings`
  - `/app/i/notifications`

## Current Planning Lens

### Most important launch-truth files

- `.artifacts/proofound-current-state-reality-check.md`
- `.artifacts/launch-readiness-summary.md`
- `.artifacts/launch-smoke-report.json`
- `src/app/api/monitoring/launch-status/route.ts`
- `scripts/launch-smoke-runner.ts`

### Most important corridor files

- `e2e/strict/org-corridor.strict.spec.ts`
- `e2e/helpers/strict-fixtures.ts`
- `e2e/strict/organization.strict.spec.ts`
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
- `src/app/api/decisions/route.ts`
- `src/lib/engagement-verifications/service.ts`

### Most important surface-reduction files

- `src/lib/launch/surface-policy.ts`
- `tests/api/launch-surface-inventory.test.ts`
- `tests/api/launch-page-inventory.test.ts`
- `tests/ui/archived-mvp-routes.test.ts`
- `src/app/page.tsx`
- `src/components/landing/sections/FooterSection.tsx`

## Launch-Surface Risk Note

- Keep treating the compiled surface as broader than the locked MVP corridor until more active families are removed or hard-gated.
- `/api/contracts` and `/app/o/[slug]/settings` are now intentionally archived, and the strict org suite was updated to assert that archived behavior.
- Fresh smoke and protected corridor evidence are no longer blockers in this pass. The remaining blocker is the size of the surviving active launch allowlist.
