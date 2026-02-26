# Manual Migration Instructions

Prefer the repository migration runner over ad hoc SQL execution.

## Standard Flow

1. Create a DB checkpoint:

```bash
npm run db:backup:checkpoint
```

2. Audit canonical migration parity:

```bash
npm run db:audit:migrations
```

3. Apply migrations:

```bash
npm run db:migrate
```

## Ledger Modes

- Default audit mode (`canonical`) checks:
  - Local `src/db/migrations/*.sql` + supplemental policy/trigger versions
  - Remote `public.app_migration_ledger`
- Optional strict legacy baseline audit:

```bash
npm run db:audit:migrations -- --mode legacy-supabase-baseline --baseline supabase/ledger-baseline/schema_migrations.current-db.json
```

- Optional diagnostics-only legacy file inventory audit:

```bash
npm run db:audit:migrations -- --mode legacy-supabase
```

## Notes

- Do not use `npm run db:push` for production.
- Do not rely on direct SQL execution for migration tracking. Use `db:migrate` so versions are recorded in `public.app_migration_ledger`.

## Verify Success

```bash
npm run typecheck
npm run test
npm run build
```
