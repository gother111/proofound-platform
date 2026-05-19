# Run Database Migrations

> Doc Class: `active`
> Last Verified: `2026-05-19`

This repository applies SQL migrations from `src/db/migrations/` with the
ledgered migration runner:

```bash
npm run db:migrate
```

`db:migrate` also tracks supplemental versions for `src/db/policies.sql` and
`src/db/triggers.sql` in `public.app_migration_ledger`.

## Production-Candidate Safety Sequence

Before applying production or production-candidate DDL:

```bash
npm run db:drift-check
npm run db:backup:checkpoint
npm run db:audit:migrations
npm run db:migrate
```

Then, for launch evidence, restore the captured backup into an isolated recovery
database and verify it:

```bash
npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json
```

The restore rehearsal is documented in `docs/launch-restore-drill.md`.

## Canonical Migration Audit

`npm run db:audit:migrations` checks canonical parity between:

- local `src/db/migrations/*.sql`
- supplemental `src/db/policies.sql`
- supplemental `src/db/triggers.sql`
- remote `public.app_migration_ledger`

## Optional Legacy Supabase Audit

For strict legacy parity against the current DB history baseline:

```bash
npm run db:audit:migrations -- --mode legacy-supabase-baseline --baseline supabase/ledger-baseline/schema_migrations.current-db.json
```

For diagnostics-only legacy file inventory comparison:

```bash
npm run db:audit:migrations -- --mode legacy-supabase
```

These legacy modes are diagnostic. They do not replace the canonical
`public.app_migration_ledger` path.

## Policy

- Use explicit SQL migration files for launch changes.
- Do not use `npm run db:push` for production or production-candidate changes.
- Do not paste migration SQL into a dashboard as launch evidence unless a
  migration emergency is explicitly approved and documented.
- Do not rely on `migrations-to-run.sql` as current migration truth.
- Do not run restore verification against a live database; use a disposable or
  explicitly-approved recovery target.

## Verification

After migration apply, run the focused tests for the changed schema path plus:

```bash
npm run docs:freshness
npm run typecheck
npm run test:launch:routes
```

For final launch gates, follow:

- `docs/launch-restore-drill.md`
- `docs/production-readiness-checklist.md`
- `docs/mvp-launch-master-checklist.md`
- `agent/checklists/verification.md`
