> Doc Class: `active`
> Last Verified: `2026-05-21`

# Supabase Setup

Use this guide to configure a local or production-candidate Supabase target for the locked Proofound
MVP corridor. It is intentionally target-agnostic: do not hard-code a project ref in docs, scripts,
screenshots, or launch evidence.

For the full environment variable reference, use
[`docs/ENV_VARIABLES.md`](docs/ENV_VARIABLES.md). For migration discipline, use
[`APPLY_MIGRATIONS_MANUAL.md`](APPLY_MIGRATIONS_MANUAL.md) and
[`RUN_MIGRATIONS_GUIDE.md`](RUN_MIGRATIONS_GUIDE.md).

## 1. Create `.env.local`

Create `.env.local` locally. Never commit it.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

DATABASE_URL=postgresql://postgres.your-project-ref:[PASSWORD]@aws-1-region.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000

PII_HASH_SALT=your-64-character-secret
CRON_SECRET=your-local-or-target-secret
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are browser-visible and designed
  for client use.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `PII_HASH_SALT`, and cron/internal
  secrets are server-only. Do not paste them into public logs, screenshots, tickets, or artifacts.
- Use the pooled `DATABASE_URL` for runtime queries and `DIRECT_URL` for migration/tooling paths
  that need a direct connection.

## 2. Confirm Local App Setup

```bash
npm install
npm run prebuild
npm run dev
```

If `npm run prebuild` reports missing variables, fix `.env.local` before continuing.

## 3. Apply Database Changes Safely

Use the repo-owned migration path:

```bash
npm run db:drift-check
npm run db:backup:checkpoint
npm run db:audit:migrations
npm run db:migrate
npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json
```

Launch rules:

- Do not use direct schema-push commands for production or production-candidate workflows.
- Do not use dashboard SQL paste as normal launch evidence.
- Confirm the intended target before running any command that can affect data.
- Run restore verification only against an isolated recovery target, never the live database.

## 4. Verify MVP Data Surfaces

Use focused checks that match the current corridor:

```bash
npm run test:launch:routes
npm run test:launch:smoke
npm run test:privacy
npm run test -- tests/privacy/storage-policies.test.ts
```

For production-candidate signoff, also use the production readiness checklist and final go/no-go
flow:

```bash
BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch
BASE_URL=<production-candidate-url> npm run perf:budgets
BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go
```

For protected launch-status and go/no-go checks, `INTERNAL_API_SECRET=<secret>` may replace
`CRON_SECRET=<secret>`.

## 5. Optional Supabase MCP

Supabase MCP can be useful for read-only inspection, advisor checks, logs, and explicit database
operations. Treat it as an operator tool, not product scope.

- Use [`docs/SUPABASE_MCP_SETUP.md`](docs/SUPABASE_MCP_SETUP.md) for MCP-specific setup.
- Prefer read-only inspection unless the target and operation are explicit.
- Do not use MCP results from an old project snapshot as current launch evidence.
- Do not expose service-role credentials or query results containing private proof/user/org data.

## 6. Current Launch Boundaries

Supabase setup supports the MVP corridor only:

- public landing, signup/login, public individual portfolio, public organization trust page, and
  active assignment/share surfaces;
- individual onboarding, Proof Packs, proof uploads/imports/links, verification requests, publishing,
  privacy, export, and delete;
- organization onboarding, trust profile, assignments, review queue, shortlist/matching, intro,
  reveal consent, interviews, decisions, and engagement verification;
- protected admin/internal launch-ops queues, audit, monitoring, and cron surfaces.

It does not re-enable archived broad Expertise Atlas UI, Zen/wellbeing, generic dashboards, public
directory behavior, or non-MVP marketplace/platform scope.
