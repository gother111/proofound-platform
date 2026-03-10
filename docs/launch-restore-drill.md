> Doc Class: `active`
> Last Verified: `2026-03-10`

# Launch Restore Drill

This drill validates that Proofound launch rollback readiness is backed by a reproducible checkpoint and a post-restore fingerprint comparison.

## Scope

- Checkpoint source of truth: `scripts/db-backup-checkpoint.mjs`
- Restore verification source of truth: `scripts/db-restore-verify.mjs`
- Fingerprint helper: `scripts/lib/db-checkpoint-utils.mjs`
- Critical tables covered by fingerprinting:
  - `profiles`
  - `organizations`
  - `assignments`
  - `interviews`
  - `conversations`
  - `messages`
  - `analytics_events`
  - `fairness_notes`
  - `verification_requests`
  - `user_video_integrations`
  - `decision_reminders`

## What Is Repo-Proven

- `npm run db:backup:checkpoint` captures:
  - database identity
  - migration ledger row count
  - table existence
  - row counts
  - latest timestamp fingerprints
  - schema and data dumps when `pg_dump` is available
- `npm run db:restore:verify -- --checkpoint <dir>` compares a restored database against the checkpoint fingerprint and fails on drift.
- `npm run go:no-go` requires both scripts and this runbook to exist before the launch gate can pass.

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

6. Optional: write a machine-readable report for evidence capture.

```bash
npm run db:restore:verify -- --checkpoint /tmp/proofound-db-checkpoints/2026-03-10T17-00-00-000Z --out /tmp/proofound-restore-report.json
```

## Pass Criteria

- Restore verification exits `0`.
- Every table comparison reports `ok: true`.
- Migration ledger row count matches the checkpoint.
- The restored database identity matches the intended recovery target.

## Failure Handling

- If row counts drift, inspect the affected table dumps in the checkpoint directory.
- If timestamps drift but counts match, inspect post-checkpoint writes and decide whether the restore target is acceptable for rollback.
- If migration ledger rows drift, do not promote the restore target until schema parity is re-established.

## Evidence To Save For Launch

- Checkpoint directory path
- `summary.json`
- `row-fingerprint.json`
- Optional `pg_dump` artifacts
- Optional restore verification report JSON
