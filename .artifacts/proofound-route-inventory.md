# Proofound Route Inventory

Generated: 2026-03-25  
Workspace: `/Users/yuriibakurov/proofound`

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
- App page routes under `src/app/**/page.tsx`: `50`
- Launch-surface classification from `src/lib/launch/surface-policy.ts`:
  - API routes: `106` active launch, `14` internal-only launch ops, `18` archived
  - Page routes: `38` active launch, `3` internal-only launch ops, `9` archived
- Cross-check:
  - filesystem counts and the 2026-03-25 build route table match the reduced current workspace

## Highest-Volume API Families

| Family | Count |
| --- | ---: |
| `cron` | 17 |
| `verification` | 12 |
| `user` | 12 |
| `match` | 11 |
| `organizations` | 8 |
| `portfolio` | 7 |
| `assignments` | 6 |
| `expertise` | 6 |
| `interviews` | 6 |
| `admin` | 5 |
| `core` | 5 |
| `upload` | 4 |

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

- The stale `187` API / `91` page claims are retired. Fresh current-state counts are `138` APIs and `50` pages.
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
