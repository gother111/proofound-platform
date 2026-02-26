> Doc Class: `governance`
> Sync Pair: `Prompt.md`
> Last Verified: `2026-02-26`

# Proofound: Project Prompt

## What This Product Is

Proofound is a credibility and connection platform built for authenticity rather than engagement algorithms, with dual personas (Individuals and Organizations), proof-first profiles, and privacy by design. (source: README.md)

## Repo Truth (Verified)

- Web stack: Next.js + React + TypeScript. (source: package.json, src/app/)
- Database + auth: Supabase (JS client) with Postgres; data access is guarded with Row Level Security (RLS). (source: README.md, package.json)
- ORM/schema source of truth: Drizzle schema lives in `src/db/schema.ts`; Drizzle is configured via `drizzle.config.ts`. (source: src/db/schema.ts, drizzle.config.ts)
- API surface: server endpoints are implemented as App Router route handlers under `src/app/api/`. (source: src/app/api/)
- Security middleware: CSP/security headers, CSRF protection, and optional edge rate limiting live in `src/middleware.ts`. (source: src/middleware.ts)
- Deployment + cron: cron schedules are configured in `vercel.json` and target `/api/cron/*` routes. (source: vercel.json, src/app/api/cron/)
- CI gates: lint, typecheck, unit tests, build, then perf budgets and go/no-go gates. (source: .github/workflows/ci.yml, scripts/perf-budgets.mjs, scripts/go-no-go-check.mjs)
- Environment variables: templates are in `.env.example` and `docs/ENV_VARIABLES.md`; secret env files are gitignored. (source: .env.example, docs/ENV_VARIABLES.md, .gitignore)
- Safety note: existing setup docs may contain concrete credentials; do not copy secrets into tracked files. (source: SETUP_SUPABASE.md)

## Non-Negotiables (Engineering Invariants)

- Never expose `SUPABASE_SERVICE_ROLE_KEY` (or any server-only secret) to the browser. (source: docs/ENV_VARIABLES.md)
- Privacy by design is a core product principle (RLS + user-controlled visibility). (source: README.md)
- Policy: Treat privacy regressions as P0; do not weaken RLS or visibility/redaction semantics.
- Do not commit secrets; follow `.gitignore` and use `.env.local` for local values. (source: .gitignore, .env.example)

## Assumptions / TODO Questions (Product + Scope)

- TODO: Define the primary MVP success metric (e.g., time-to-first-qualified-intro, contracts signed, retention).
- TODO: Confirm which persona flows are “must ship” for MVP vs “later” (repo contains many implemented features). (source: IMPLEMENTATION_STATUS_CURRENT.md)
- TODO: Confirm which verification methods are required for MVP (work email, LinkedIn, Veriff). (source: IDENTITY_VERIFICATION_IMPLEMENTATION.md, docs/LINKEDIN_VERIFICATION_SETUP.md)
- TODO: Confirm target locales/regions (i18n exists; decide launch scope). (source: README.md)
