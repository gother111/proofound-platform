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

### API Security Flow (Repo Truth)

- API routes are protected by CSRF middleware with an allowlist for public endpoints; security headers are applied in both `src/middleware.ts` and `next.config.js`. (source: src/middleware.ts, next.config.js)

### CI Gate Flow (Repo Truth)

- CI runs lint, typecheck, unit tests, build, starts the app, then runs perf budgets and go/no-go gates. (source: .github/workflows/ci.yml)
- Perf budgets are implemented in `scripts/perf-budgets.mjs` (Lighthouse + API p95). (source: scripts/perf-budgets.mjs)
- Go/no-go checks are implemented in `scripts/go-no-go-check.mjs` and require evidence files. (source: scripts/go-no-go-check.mjs)

## Risk Areas / TODOs

- Repo Truth: CI tests Node 18.x and 20.x, but engines require Node >= 20.20.0. (source: .github/workflows/ci.yml, package.json, .nvmrc)
- TODO: `npm run test:a11y` references `playwright.a11y.config.ts`; validate that file exists and is aligned. Do not create it in docs-only runs. (source: package.json)
- TODO: `scripts/go-no-go-check.mjs` requires `ACCESSIBILITY_AUDIT_REPORT.md`; ensure the repo contains the required evidence file(s) before relying on this gate. Do not invent missing evidence files. (source: scripts/go-no-go-check.mjs)
- Repo Truth: CSP/security headers are set in both `next.config.js` and `src/middleware.ts`. (source: next.config.js, src/middleware.ts)
- Guidance: Coordinate changes across both to avoid conflicting policies.
