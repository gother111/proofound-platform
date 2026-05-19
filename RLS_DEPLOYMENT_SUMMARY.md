> Doc Class: `historical`
> Last Verified: `2026-05-19`

# Historical RLS Deployment Summary

This file is historical context for an October 30, 2025 RLS deployment note. Do not use it as
current launch evidence, current schema inventory, or proof that every active MVP table and policy
is protected in the target environment.

Current RLS and privacy launch evidence must come from the repo-owned migration path and fresh test
or live-target evidence:

- `APPLY_MIGRATIONS_MANUAL.md`
- `RUN_MIGRATIONS_GUIDE.md`
- `docs/DEPLOYMENT_CHECKLIST.md`
- `docs/production-readiness-checklist.md`
- `tests/privacy/rls-policies.test.ts`
- `tests/privacy/rls-policies-extended.test.ts`
- `tests/privacy/rls-mvp-isolation.test.ts`
- `tests/privacy/storage-policies.test.ts`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`

For production-candidate or production targets, do not cite this file as final signoff. Confirm the
target, then collect fresh drift, backup/checkpoint, migration-audit, repo-owned migrate, isolated
restore, and privacy/no-leak evidence.

Required current commands and gates:

```bash
npm run db:drift-check
npm run db:backup:checkpoint
npm run db:audit:migrations
npm run db:migrate
npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json
npm run test:privacy
npm run test:privacy:extended
```

Do not use `npm run db:push`, dashboard SQL paste, or stale table/policy counts as production
launch evidence.

## Historical Snapshot

The superseded note claimed the following historical state:

- Deployment date: October 30, 2025
- Status: successfully deployed
- Migration: `001_enable_rls_policies`
- Claimed table coverage: 20 tables
- Claimed policy count: 124 policies

Those claims may explain older audit history, but they are not authoritative for the current locked
MVP corridor. The active data model, upload lifecycle, workflow privacy surfaces, public portfolio
projection, organization review corridor, reveal consent, export/delete behavior, and admin/internal
queues have changed since then.

## Current Interpretation

Treat this file as an archived status report. If a current task touches RLS, storage policies,
public projection, reveal, matching, verification, export/delete, or admin/internal queues, use the
current migration files under `src/db/migrations/`, the active privacy tests, and fresh target
evidence.
