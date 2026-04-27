# Production Launch Evidence

Doc Class: `operations`
Last Verified: `2026-04-27`
Production URL: `https://proofound.io`
Reviewed commit: `488088db3b3de8fa0d927a94ea9ef99853af38b3`

## Live Readiness

- Live `/api/health`: `PASS`
  - Evidence: `.artifacts/launch-validation-2026-04-27/20_live_health.json`
- Live `/api/monitoring/launch-status`: `PASS`
  - Evidence: `.artifacts/launch-validation-2026-04-27/23_live_launch_status.json`
- Full launch smoke artifact refresh: `PASS`
  - Evidence: `.artifacts/launch-validation-2026-04-27/21_live_launch_smoke_report.json`
- Full launch gate bundle: `GO`
  - Evidence: `.artifacts/launch-validation-2026-04-27/24_gate_summary.json`

## Critical Alert Drill

Critical alert drill status: `PASS`

The launch monitoring path is the production critical-alert source for the limited MVP pilot. It was refreshed against `https://proofound.io` on `2026-04-27` and covered:

- auth-adjacent public portfolio access and hidden portfolio protection
- email/privacy workflow coverage through the repo-ready workflow email privacy gate
- upload/privacy coverage through the repo-ready manual privacy sweep
- workflow failures through the full org corridor review to engagement verification smoke
- privacy leak coverage through the live privacy no-leak case
- live health and launch readiness through `/api/health` and `/api/monitoring/launch-status`

Evidence:

- `.artifacts/launch-smoke-report.json`
- `.artifacts/launch-validation-2026-04-27/repo-ready-workflow-email-privacy.log`
- `.artifacts/launch-validation-2026-04-27/repo-ready-manual-privacy.log`
- `.artifacts/launch-validation-2026-04-27/21_live_launch_smoke.log`
- `.artifacts/launch-validation-2026-04-27/final-launch-checklist-live-launch-status.json`

## Restore Drill

Restore drill status: `PASS`

The production restore drill was run after explicit approval on `2026-04-27`. A production checkpoint was created under `/tmp`, restored into an isolated recovery target, verified with the repository restore verifier, and then the raw temporary dump directory was removed.

Evidence:

- Redacted report: `.artifacts/launch-validation-2026-04-27/restore-drill-redacted-report.json`
- Raw verifier result before cleanup: `/tmp/proofound-restore-report-20260427.raw.json`
- Isolated recovery target: local PostgreSQL 17 database `proofound_restore_drill_20260427`
- Verification command: `DB_RESTORE_VERIFY_SSL=disable npm run db:restore:verify -- --checkpoint <temporary-checkpoint-dir> --out /tmp/proofound-restore-report-20260427.raw.json`

Verification result:

- 11 critical tables audited.
- Every audited table existed in the isolated recovery target.
- Row counts matched.
- Latest timestamp fingerprints matched.
- Restore verifier exited `0`.

Local compatibility note:

- Production uses PostgreSQL 17 and pgvector. The isolated local drill used PostgreSQL 17 client/server tooling, with vector columns represented as text in the local-compatible schema because pgvector is not installed locally. This did not affect the launch restore fingerprint contract, which validates table existence, row counts, and latest timestamp fingerprints.

## Operator Notes

- Repo-owned engineering and product gates are green.
- GTM, owner roster, and pilot launch motion are documented in repo source of truth.
- Restore evidence is now real and redacted in the repository.
