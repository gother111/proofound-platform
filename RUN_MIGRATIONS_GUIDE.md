# How to Run Database Migrations

> Doc Class: `active`
> Last Verified: `2026-02-26`

## Canonical Method (Recommended)

This repository applies SQL migrations from `src/db/migrations/` via:

```bash
npm run db:migrate
```

`db:migrate` also tracks supplemental versions for `src/db/policies.sql` and `src/db/triggers.sql` in `public.app_migration_ledger`.

## Safety Sequence

Before applying production DDL, run:

```bash
npm run db:backup:checkpoint
npm run db:audit:migrations
npm run db:migrate
```

- `db:audit:migrations` (default mode) checks canonical parity:
  - local: `src/db/migrations/*.sql` + supplemental policy/trigger versions
  - remote: `public.app_migration_ledger`

## Optional Legacy Supabase Audit

For strict legacy parity against the current DB history baseline, run:

```bash
npm run db:audit:migrations -- --mode legacy-supabase-baseline --baseline supabase/ledger-baseline/schema_migrations.current-db.json
```

This checks remote `supabase_migrations.schema_migrations` against the committed baseline snapshot.

Diagnostics-only legacy file inventory comparison remains available:

```bash
npm run db:audit:migrations -- --mode legacy-supabase
```

## Verification

After migration apply, run:

```bash
npm run typecheck
npm run test
npm run build
```
