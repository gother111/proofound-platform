# Migration And RLS Report

## Migration Decision

No migration was added. The existing `start_from_cv_import_sessions` JSON payload supports the new draft metadata without schema expansion.

## RLS Posture

The existing session table has owner-only RLS for select, insert, and update. This slice hardens the application layer by enforcing expiry, state transitions, and accepted-draft subset validation.

## Verification

- `npm run db:audit:migrations`: PASS with a non-blocking warning that the DB contains 5 extra historical migration rows not present locally.
- `npm run db:drift-check`: PASS.
- `npm run test:privacy`: BLOCKED because `.env.test` lacks Supabase test credentials.

## Remaining Gate

Before broader launch, add Start from CV-specific RLS tests and cleanup job evidence. If future provenance needs per-row accepted-context metadata, request explicit migration approval first.
