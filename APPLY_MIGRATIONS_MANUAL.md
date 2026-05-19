# Apply Migrations Manually

> Doc Class: `active`
> Last Verified: `2026-05-19`

Prefer the repository migration runner over ad hoc SQL execution. This guide is
for an explicitly selected local, staging, or production-candidate database
target. Do not run production DDL unless the target is confirmed and the launch
owner has approved the operation.

## Standard Safety Flow

1. Confirm `DIRECT_URL` or `DATABASE_URL` points at the intended database target.

2. Check migration path discipline:

```bash
npm run db:drift-check
```

3. Create a pre-change checkpoint:

```bash
npm run db:backup:checkpoint
```

4. Audit canonical migration parity:

```bash
npm run db:audit:migrations
```

5. Apply migrations through the ledgered runner:

```bash
npm run db:migrate
```

6. If this is launch-candidate evidence, restore the checkpoint into an isolated
   recovery target and verify it:

```bash
npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json
```

Use `docs/launch-restore-drill.md` for the full restore rehearsal.

## Ledger Modes

Default audit mode (`canonical`) checks:

- local `src/db/migrations/*.sql`
- supplemental `src/db/policies.sql`
- supplemental `src/db/triggers.sql`
- remote `public.app_migration_ledger`

Optional strict legacy baseline audit:

```bash
npm run db:audit:migrations -- --mode legacy-supabase-baseline --baseline supabase/ledger-baseline/schema_migrations.current-db.json
```

Optional diagnostics-only legacy file inventory audit:

```bash
npm run db:audit:migrations -- --mode legacy-supabase
```

## Do Not

- Do not use `npm run db:push` for production or production-candidate
  migrations.
- Do not paste one-off SQL into a dashboard as the normal launch migration path.
- Do not rely on `migrations-to-run.sql` for current launch migration evidence.
- Do not broaden restore gates to retired compatibility tables unless the locked
  MVP scope changes.
- Do not expose database URLs, service credentials, or migration logs containing
  secrets.

## Verify Success

For code/schema changes, run the relevant focused tests plus:

```bash
npm run docs:freshness
npm run typecheck
npm run test:launch:routes
```

For production-candidate launch evidence, also record:

- checkpoint directory path
- `summary.json`
- `row-fingerprint.json`
- restore verification report, if generated
- migration audit output
- the exact target label, without secrets
