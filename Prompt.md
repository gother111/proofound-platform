# Proofound Platform (Prompt)

> Doc Class: `governance`
> Sync Pair: `project/Prompt.md`
> Last Verified: `2026-02-12`

## Product Summary

Proofound is a two-sided platform for authentic, privacy-first matching between individuals and organizations.

## Repo Truth

- Framework: Next.js App Router + React + TypeScript (`package.json`, `src/app/`).
- Runtime: Node `20.20.0` (`.nvmrc`, `package.json`).
- Data stack: Supabase + Postgres + Drizzle (`src/db/schema.ts`, `drizzle.config.ts`).
- API routes: `src/app/api/**`.
- Security middleware: `src/middleware.ts`.
- Cron schedules: `vercel.json`.
- CI gates: `.github/workflows/ci.yml`.

## Non-Negotiables

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Treat privacy and RLS regressions as P0.
- Do not commit secrets.

## Canonical References

- `project/Prompt.md`
- `project/Architecture.md`
- `project/Plans.md`
- `project/Implement.md`
- `project/Documentation.md`
