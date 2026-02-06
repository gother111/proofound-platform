# Verification

## Local Verification (Fast)

- `npm run typecheck` (`tsc --noEmit`). (`/Users/yuriibakurov/proofound/package.json:13`)
- `npm run lint` (repo wrapper). (`/Users/yuriibakurov/proofound/package.json:11`)
- `npm test` (Vitest run). (`/Users/yuriibakurov/proofound/package.json:21`)
- `npm run build` (`next build`). (`/Users/yuriibakurov/proofound/package.json:9`)

## Remote DB Migration Verification

1. Confirm migration history table is accessible:

```sql
select count(*) as migration_count
from supabase_migrations.schema_migrations;
```

2. Apply pending migrations via CLI using pooler-safe params (see `setup.md`).

## Vercel Deployment Log Triage

When Vercel shows `Command \"npm run build\" exited with 1`, the most common actionable lines are:

- `Type error: Route ... has an invalid \"GET\" export` (App Router handler signature mismatch).
- `Module not found: Can't resolve ...` (missing file/export or alias misconfig).
- Build-time runtime crashes from provider initialization (DB/email) at module scope.

Representative examples from this refactor cycle:

- Missing modules at `400cc9e`: [deployment](https://vercel.com/pavlo-samoshkos-projects/proofound-platform/3KbGmwiBA83r2pimGTH9qnXtNQ5s)
- Invalid route handler exports at `9599114`: [deployment](https://vercel.com/pavlo-samoshkos-projects/proofound-platform/cmedf8Heh5yp1PXxD7RAi62bA77w)
