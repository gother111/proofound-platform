# Setup Runbook (Mirror)

> Doc Class: `governance`
> Sync Pair: `agent/runbooks/setup.md`
> Last Verified: `2026-02-12`

## Environment and Tooling

- Node version: `20.20.0` (`.nvmrc`).
- Use `.env.example` and `docs/ENV_VARIABLES.md` for env setup.
- Never commit `.env*` secrets.

## Core Commands

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## DB and Migrations

- Drizzle config: `drizzle.config.ts`
- Schema: `src/db/schema.ts`
- SQL migrations: `supabase/migrations/`

## Canonical Reference

- `agent/runbooks/setup.md`
