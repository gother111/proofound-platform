> Doc Class: `reference-spec`
> Last Verified: `2026-05-19`

# Database Flow Verification Guide

## Purpose

Track database-oriented verification flows for local and pre-release checks.

## Canonical Commands

### Schema and Migration Discipline

- `npm run db:drift-check`
- `npm run db:audit:migrations`
- `npm run db:migrate`

### Safety and Audit Helpers

- `npm run db:backup:checkpoint`
- `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`

### Privacy and Policy Validation

- `npm run test:privacy`
- `npm run test:privacy:extended`

## What to Validate

### 1) Migration Path Integrity

- Ordered SQL migration files are present and ledger-consistent.
- No production workflow depends on `npm run db:push`.
- Production-candidate launch signoff has a fresh restore report at `.artifacts/launch-restore-report.json`.

### 2) Core Entity Persistence

- Profile data persists in expected profile tables.
- Organization creation persists membership and role relations.
- Matching setup persists profile and skill entities.
- Assignment creation persists correctly and links to org context.

### 3) Privacy and RLS Behavior

- Cross-user and cross-org data access is blocked by policy.
- Visibility semantics are enforced by API + DB policy layer.

### 4) Verification Data Integrity

- Verification request/respond/status flows persist expected transitions.
- Expiration/reverification constraints are honored.

## Manual SQL Spot Checks (Example Targets)

- `profiles`, `individual_profiles`
- `organizations`, `organization_members`
- `matching_profiles`, `skills`
- `assignments`, `matches`
- verification-related tables introduced by latest migrations

## Canonical References

- `agent/runbooks/setup.md`
- `agent/checklists/verification.md`
- `RUN_MIGRATIONS_GUIDE.md`
- `APPLY_MIGRATIONS_MANUAL.md`
