# System Overview Audit

Audit snapshot: `2026-03-05`

## Category Score

### Architecture: 3/5

The system is functional and the major product surfaces are implemented, but the live shape is broader and less cohesive than the architecture narrative suggests. The codebase has clear persona shells and a credible platform backbone, yet route sprawl, duplicated security policy, and partial scheduling coverage increase coordination cost and drift risk.

## Actual System Map

- Public and marketing surface:
  - `src/app/page.tsx`
  - public/legal/support routes in `src/app/*`
  - shared root shell in `src/app/layout.tsx`
- Authentication and onboarding:
  - auth entrypoints under `src/app/(auth)/*`
  - callback and redirect handling in `src/app/auth/callback/route.ts`
  - onboarding gate in `src/app/onboarding/page.tsx`
- Individual product shell:
  - `src/app/app/i/*`
  - includes profile, matching, messages, notifications, settings, zen, expertise
- Organization product shell:
  - `src/app/app/o/[slug]/*`
  - includes assignments, candidates, interviews, matching, team, settings
- Admin surface:
  - `src/app/admin/*`
  - `src/app/api/admin/*`
- API and integration surface:
  - `src/app/api/**`
  - local inventory on `2026-03-05`: `294` route handlers and `13` cron route handlers
- Data and identity:
  - Supabase auth and storage clients in `src/lib/supabase/*`
  - Drizzle schema in `src/db/schema.ts`
  - DB bootstrap in `src/db/index.ts`
- Automation and observability:
  - scheduled entrypoints in `vercel.json`
  - cron handlers under `src/app/api/cron/*`
  - health/perf status routes under `src/app/api/health/route.ts` and `src/app/api/monitoring/perf-status/route.ts`
  - Sentry wrapping in `next.config.js`

## What Is Working and Should Be Preserved

- Dual persona separation is real, not aspirational. `README.md:36-52` and the implemented route shells line up on the core user split.
- Auth callback redirect hardening is better than average. `src/app/auth/callback/route.ts:68-86` validates `next` as same-origin or relative before redirecting.
- Middleware already carries meaningful protections:
  - CSRF issuance and checks in `src/middleware.ts:152-199`
  - edge rate limiting in `src/middleware.ts:91-139`
  - scanner-path short-circuiting in `src/middleware.ts:83-89`
- Health reporting is usable in production. Warm prod verification returned `200` for `/login` and `healthy` for `/api/health`.

## Findings

### SY-01: Route surface has outgrown the documented architecture

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `find src/app/api -name 'route.ts' | wc -l` returned `294`
  - `find src/app/api/cron -name 'route.ts' | wc -l` returned `13`
  - `find src/app -name 'page.tsx' | wc -l` returned `92`
  - `README.md:17-35` presents a much simpler flow diagram than the current route inventory
- Why it matters:
  - Architecture complexity is now being carried implicitly in route layout rather than explicitly in module boundaries or docs.
  - This increases onboarding cost, makes duplicate behavior more likely, and raises regression risk when changes touch matching, admin, cron, or auth.
- Next action:
  - Treat the route inventory as a first-class architecture asset.
  - Rationalize the route map by subsystem and declare canonical entrypoints for auth, matching, cron, and admin operations.

### SY-02: Security header policy is defined in two places with different behavior

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `next.config.js:47-94` defines global headers including `Permissions-Policy`, HSTS, and referrer policy
  - `src/middleware.ts:7-60` separately defines CSP, frame policy, permissions policy, and conditional HSTS
  - Warm prod browser verification emitted warnings for unsupported `Permissions-Policy` features (`ambient-light-sensor`, `battery`)
- Why it matters:
  - Security policy drift is already observable at runtime.
  - Future changes to CSP, framing, or permissions will require synchronized edits in multiple places and are likely to diverge further.
- Next action:
  - Consolidate security header ownership into one canonical path and leave only route-specific exceptions outside it.

### SY-03: Runtime behavior changes materially when `DATABASE_URL` is absent

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `src/db/index.ts:31-82` falls back to an in-memory mock DB unless production runtime and no explicit mock allowance
  - `src/db/index.ts:50-69` logs that operations appear to work while data is lost on restart
  - `/api/health` exposes `usingMockDb` in `src/app/api/health/route.ts:31-51`
- Why it matters:
  - The repo does not have a single runtime architecture. It has a real DB mode and a mock DB mode with very different failure characteristics.
  - This can hide misconfiguration in local or preview environments and undermines confidence in CRUD flow verification.
- Next action:
  - Narrow mock DB usage to explicitly named dev/test paths and fail closed everywhere else.

### SY-04: Cron implementation and cron scheduling are different systems today

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `vercel.json:9-26` schedules 4 cron paths
  - `src/app/api/cron/*` contains 13 handlers
  - `README.md:277-300` documents additional cron routes and schedules not present in `vercel.json`
- Why it matters:
  - The codebase contains more automation entrypoints than the actual scheduler runs.
  - Unscheduled handlers become stale, and scheduled behavior can be misunderstood by product, ops, and QA.
- Next action:
  - Publish one canonical schedule matrix that maps each cron route to its owner, trigger, auth requirement, and current deployment state.

### SY-05: The platform has strong subsystem primitives but weak canonical boundaries

- Status: Strong inference
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - Clear shared primitives exist in `src/lib/auth.ts`, `src/lib/api/auth.ts`, `src/middleware.ts`, and `src/db/*`
  - Matching and analytics logic are spread across `src/app/api/match*`, `src/app/api/matching*`, `src/app/api/core/matching/*`, and admin analytics endpoints
- Why it matters:
  - The repo can still move quickly because there are shared primitives, but subsystem ownership is blurred enough that naming drift and duplicate flow logic are becoming structural problems.
- Next action:
  - Define canonical subsystem owners and route namespaces before adding more API surface.
