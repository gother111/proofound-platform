# Proofound Route Inventory

Generated: 2026-03-21  
Workspace: `/Users/yuriibakurov/proofound`

## Purpose

This is a code-grounded route-surface snapshot for the current workspace. It is an execution lens only, not product authority.

## Current Counts

- API route handlers under `src/app/api/**`: `187`
- App page routes under `src/app/**/page.tsx`: `91`

## Highest-Volume API Families

| Family          | Count |
| --------------- | ----: |
| `cron`          |    17 |
| `organizations` |    16 |
| `verification`  |    15 |
| `user`          |    13 |
| `match`         |    11 |
| `feedback`      |     8 |
| `integrations`  |     7 |
| `portfolio`     |     7 |
| `assignments`   |     6 |
| `expertise`     |     6 |
| `interviews`    |     6 |
| `admin`         |     5 |
| `core`          |     5 |
| `notifications` |     5 |

## Launch-Critical Route Families

These are the narrowest current routes that matter most for the locked MVP corridor and current launch evidence:

- `src/app/api/health/route.ts`
- `src/app/api/monitoring/launch-status/route.ts`
- `src/app/api/verify/[token]/route.ts`
- `src/app/api/verification/status/route.ts`
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
- `src/app/api/decisions/route.ts`
- `src/app/api/engagement-verifications/[id]/route.ts`
- `src/app/api/upload/document/route.ts`
- `src/app/portfolio/[handle]/page.tsx`
- `src/app/portfolio/org/[slug]/page.tsx`
- `src/app/verify/[token]/page.tsx`

## Route-Surface Truth For This Pass

- The active route tree is narrower than the March 16 artifact claimed.
- Earlier companion docs called out active `contracts`, `projects`, and `skill-gaps` families as top-level breadth problems. Those families are not present in the current top-level API family counts anymore.
- The route tree is still broader than the locked MVP corridor. The largest remaining breadth is concentrated in:
  - `cron`
  - `organizations`
  - `verification`
  - `user`
  - `match`
  - `feedback`
  - `integrations`
  - `admin`
  - `expertise`

## Current Planning Lens

### Most important launch truth files

- `scripts/launch-smoke-runner.ts`
- `.artifacts/launch-smoke-report.json`
- `src/app/api/monitoring/launch-status/route.ts`
- `scripts/go-no-go-check.ts`

### Most important org corridor files

- `e2e/strict/org-corridor.strict.spec.ts`
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `src/app/api/conversations/[conversationId]/reveal/route.ts`
- `src/app/api/decisions/route.ts`
- `src/lib/workflow/service.ts`
- `src/lib/engagement-verifications/service.ts`

### Most important public trust files

- `scripts/seed-public-org-trust-fixture.ts`
- `e2e/public-org-trust.smoke.spec.ts`
- `src/lib/launch/public-org-trust-fixture.ts`
- `src/app/portfolio/org/[slug]/page.tsx`
- `src/lib/portfolio/public-projection.ts`

## Launch-Surface Risk Note

- Fresh smoke evidence is green in this workspace.
- The route inventory still shows a broader active surface than the locked proof-first hiring corridor.
- Treat route reduction and hard-gating of non-critical families as follow-on launch risk work, not as already-completed scope.
