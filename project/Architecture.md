> Doc Class: `governance`
> Sync Pair: `Architecture.md`
> Last Verified: `2026-02-26`

# Architecture Snapshot

This document records a lightweight, repo-grounded architecture view. Statements marked **Repo Truth** are cited like `(source: README.md)`. Anything else is labeled **Inference**, **Proposal**, or **TODO**.

## Stack (Repo Truth)

- Runtime: Node `20.20.0` is pinned in `.nvmrc`; `package.json` engines require `>=20.20.0 <21`. (source: .nvmrc, package.json)
- Framework: Next.js (App Router) + React + TypeScript. (source: package.json, src/app/, tsconfig.json)
- Styling/UI: Tailwind CSS is configured in `tailwind.config.ts`; UI libs include Radix and shadcn-style components under `src/components/ui/`. (source: tailwind.config.ts, package.json, src/components/ui/)
- Data: Supabase JS client and Postgres; ORM/schema via Drizzle. (source: package.json, drizzle.config.ts, src/db/schema.ts)
- Observability: Sentry is integrated via Next.js config. (source: package.json, next.config.js)
- Email: Resend + React Email dependencies are present. (source: package.json)
- Testing: Vitest (unit) + Playwright (E2E). (source: package.json, vitest.config.ts, playwright.config.ts)
- Hosting: Vercel cron schedules are configured in `vercel.json`. (source: vercel.json)
- External sub-daily worker scheduling can be managed through cron-job.org via `scripts/sync-cron-job-org.mjs`. (source: package.json, scripts/sync-cron-job-org.mjs)

## Folder Map (Repo Truth)

- App routes (pages/layouts): `src/app/` (source: src/app/)
- API routes: `src/app/api/` (source: src/app/api/)
- Server-side actions/business logic: `src/actions/` (source: src/actions/)
- Components: `src/components/` (source: src/components/)
- Libraries (domain + infra): `src/lib/` (source: src/lib/)
- DB schema and SQL: `src/db/schema.ts`, `src/db/policies.sql`, `src/db/triggers.sql` (source: src/db/schema.ts, src/db/policies.sql, src/db/triggers.sql)
- Operational/CI scripts: `scripts/` (source: scripts/)
- E2E tests: `e2e/` (source: e2e/)
- Additional tests: `tests/` (source: tests/)
- Supabase migrations: `supabase/migrations/` (source: supabase/migrations/)

## Entrypoints (Repo Truth)

- Next.js config (headers/CSP, intl, Sentry): `next.config.js` (source: next.config.js)
- Middleware (CSP headers, CSRF, rate limiting, scanner blocks): `src/middleware.ts` (source: src/middleware.ts)
- Drizzle schema: `src/db/schema.ts` (source: src/db/schema.ts)
- Drizzle config (uses `DIRECT_URL` or `DATABASE_URL`): `drizzle.config.ts` (source: drizzle.config.ts)
- Cron schedule definition: `vercel.json` (source: vercel.json)
- CI workflow: `.github/workflows/ci.yml` (source: .github/workflows/ci.yml)

## Key Flows

### Request + Data Flow (Repo Truth)

- Browser traffic hits Next.js; reads/writes flow through Supabase with RLS enforced. (source: README.md)

### Python Compute Layer (Repo Truth)

- Public CV import routes stay in Next.js while Python handles the document-intelligence compute path behind internal-only contracts. (source: src/lib/expertise/python-cv-proxy.ts, api/python/cv_import.py, python_cv/contracts.py)
- The Python service can stay in-process or move behind a separate base URL via `PYTHON_CV_IMPORT_BASE_URL` without changing the public TypeScript route surface. (source: src/lib/python-internal/service.ts)
- Internal queue-backed Python work uses `public.python_internal_jobs` plus the worker route `/api/cron/python-internal-worker` and the internal enqueue route `/api/internal/python-jobs`. (source: src/db/schema.ts, src/db/migrations/20260306103000_add_python_internal_jobs.sql, src/app/api/cron/python-internal-worker/route.ts, src/app/api/internal/python-jobs/route.ts)

### Queue + Worker Flow (Repo Truth)

- Match refresh jobs and Python internal jobs both use Postgres-backed leasing with retries/backoff rather than Redis or a separate broker. (source: src/lib/matching/refresh-queue.ts, src/lib/python-internal/job-queue.ts)
- Python internal jobs are claimed by a cron worker, executed through the versioned Python contract, and written back to the queue row as `result` or `last_error`. (source: src/app/api/cron/python-internal-worker/route.ts, src/lib/python-internal/client.ts, api/python/cv_import.py)
- On Hobby, the Python internal worker is intended to be triggered by cron-job.org rather than Vercel Cron because the schedule is sub-daily. (source: README.md, scripts/sync-cron-job-org.mjs)

### API Security Flow (Repo Truth)

- API routes are protected by CSRF middleware with an allowlist for public endpoints; security headers are applied in both `src/middleware.ts` and `next.config.js`. (source: src/middleware.ts, next.config.js)

### CI Gate Flow (Repo Truth)

- CI runs lint, typecheck, unit tests, build, starts the app, then runs perf budgets and go/no-go gates. (source: .github/workflows/ci.yml)
- Perf budgets are implemented in `scripts/perf-budgets.mjs` (Lighthouse + API p95). (source: scripts/perf-budgets.mjs)
- Go/no-go checks are implemented in `scripts/go-no-go-check.mjs` and require evidence files. (source: scripts/go-no-go-check.mjs)

## Risk Areas / TODOs

- Repo Truth: CSP/security headers are set in both `next.config.js` and `src/middleware.ts`. (source: next.config.js, src/middleware.ts)
- Guidance: Coordinate security header changes across both surfaces to avoid policy drift.
- Go/no-go evidence remains an operational dependency through `ACCESSIBILITY_AUDIT_REPORT.md` in `scripts/go-no-go-check.mjs`. (source: scripts/go-no-go-check.mjs, ACCESSIBILITY_AUDIT_REPORT.md)
- Guidance: `PYTHON_INTERNAL_SERVICE_SECRET` should be configured explicitly before moving the document-intelligence service to a separate deployment; relying on `CRON_SECRET` fallback is acceptable only as a transitional compatibility path. (source: src/lib/python-internal/service.ts, api/python/cv_import.py)
