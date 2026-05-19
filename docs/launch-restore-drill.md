> Doc Class: `active`
> Last Verified: `2026-05-19`

# Launch Restore Drill

This drill validates that Proofound launch rollback readiness is backed by a reproducible checkpoint and a post-restore fingerprint comparison.

## Scope

- Checkpoint source of truth: `scripts/db-backup-checkpoint.mjs`
- Restore verification source of truth: `scripts/db-restore-verify.mjs`
- Fingerprint helper: `scripts/lib/db-checkpoint-utils.mjs`
- Critical tables covered by fingerprinting:
  - `profiles`
  - `individual_profiles`
  - `organizations`
  - `organization_members`
  - `proof_artifacts`
  - `proof_packs`
  - `proof_pack_items`
  - `verification_records`
  - `capability_tokens`
  - `capability_token_events`
  - `portfolio_publication_states`
  - `assignments`
  - `matches`
  - `match_review_states`
  - `intro_workflows`
  - `reveal_events`
  - `interviews`
  - `decisions`
  - `engagement_verifications`
  - `conversations`
  - `messages`
  - `data_portability_exports`
  - `profile_deletion_requests`
  - `uploaded_files`
  - `internal_ops_queue_items`
  - `audit_logs`
  - `analytics_events`

The checkpoint table list is intentionally limited to active MVP, internal launch-ops, privacy/export/delete, and audit-trail state. Retired compatibility tables such as legacy verification requests, native video integrations, fairness notes, and decision reminders are not launch restore gates unless the locked MVP scope changes.

## What Is Repo-Proven

- `npm run db:backup:checkpoint` captures:
  - database identity
  - migration ledger row count
  - table existence
  - row counts
  - latest timestamp fingerprints
  - schema and data dumps when `pg_dump` is available
- `npm run db:restore:verify -- --checkpoint <dir>` compares a restored database against the checkpoint fingerprint and fails on drift.
- Local `npm run go:no-go` requires the restore scripts and this runbook to exist.
- Production-candidate `npm run go:no-go` additionally requires a fresh passing restore verification report, defaulting to `.artifacts/launch-restore-report.json`.
- `tests/scripts/db-checkpoint-critical-tables.test.ts` keeps the fingerprint table list aligned with the current MVP corridor and rejects retired compatibility tables as launch restore gates.

## What Is Still Manual

- Executing the actual database restore into a clean recovery target.
- Promoting the restored database back into a live environment.
- Re-pointing app infrastructure or connection strings after a real rollback.

## Prerequisites

- `DIRECT_URL` or `DATABASE_URL` points at the database you want to checkpoint or verify.
- Run restores only against a disposable or explicitly-approved recovery target.
- Prefer `pg_restore` or platform-native restore tooling for the actual data restore step.

## Drill Steps

1. Capture a checkpoint from the pre-change database.

```bash
npm run db:backup:checkpoint
```

2. Record the emitted checkpoint directory. Example:

```text
/tmp/proofound-db-checkpoints/2026-03-10T17-00-00-000Z
```

3. Restore that backup into a clean recovery database using your platform restore flow.

4. Point `DIRECT_URL` or `DATABASE_URL` at the restored recovery database.

5. Verify the restore fingerprint against the checkpoint.

```bash
npm run db:restore:verify -- --checkpoint /tmp/proofound-db-checkpoints/2026-03-10T17-00-00-000Z
```

6. Write a machine-readable report for final go/no-go evidence capture.

```bash
npm run db:restore:verify -- --checkpoint /tmp/proofound-db-checkpoints/2026-03-10T17-00-00-000Z --out .artifacts/launch-restore-report.json
```

7. Run final go/no-go against the production-candidate target from an environment that can still read the checkpoint directory referenced by the restore report.

```bash
BASE_URL=<production-candidate-url> SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go
```

## Pass Criteria

- Restore verification exits `0`.
- Every table comparison reports `ok: true`.
- Migration ledger row count matches the checkpoint.
- The restored database identity matches the intended recovery target.
- `.artifacts/launch-restore-report.json` exists, has `ok: true`, is fresh, and still points to readable `summary.json` and `row-fingerprint.json` checkpoint evidence.

## Failure Handling

- If row counts drift, inspect the affected table dumps in the checkpoint directory.
- If timestamps drift but counts match, inspect post-checkpoint writes and decide whether the restore target is acceptable for rollback.
- If migration ledger rows drift, do not promote the restore target until schema parity is re-established.

## Evidence To Save For Launch

- Checkpoint directory path
- `summary.json`
- `row-fingerprint.json`
- Optional `pg_dump` artifacts
- Restore verification report JSON, normally `.artifacts/launch-restore-report.json`
