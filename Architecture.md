# Architecture

> Doc Class: `governance`
> Sync Pair: `project/Architecture.md`
> Last Verified: `2026-02-12`

## Stack

- Next.js App Router + React + TypeScript.
- Tailwind + Radix-based UI components.
- Supabase + Postgres + Drizzle.
- Sentry for observability.

## Key Paths

- App routes: `src/app/`
- API routes: `src/app/api/`
- DB schema and SQL: `src/db/`
- Migrations: `supabase/migrations/`
- Scripts: `scripts/`

## Entrypoints

- Next config: `next.config.js`
- Middleware: `src/middleware.ts`
- Drizzle config: `drizzle.config.ts`
- Cron config: `vercel.json`
- CI workflow: `.github/workflows/ci.yml`

## Canonical Reference

- `project/Architecture.md`
