# Legacy Supabase Migration Snapshot

This directory is retained as historical Supabase CLI evidence only.

Current runtime migrations are applied from:

- `src/db/migrations/`
- `src/db/policies.sql`
- `src/db/triggers.sql`

Use `run-migrations.mjs` and `scripts/audit-migration-ledger.mjs --mode canonical` for current database migration and RLS evidence. Do not treat older SQL in this directory as the active source of truth without cross-checking the canonical app migration ledger.
