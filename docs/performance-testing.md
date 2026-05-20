> Doc Class: `active`
> Last Verified: `2026-05-19`

# Performance Testing Guide

## Scope

This guide covers the enforced performance gates used for release readiness.

## Canonical Commands

### Budget Gate (required)

- `BASE_URL=<production-candidate-url> npm run perf:budgets`

What it checks (`scripts/perf-budgets.mjs`):

- Lighthouse Desktop TTI <= 12000ms
- Lighthouse Mobile TTI <= 6500ms
- Lighthouse CLS <= 0.95
- `/api/health` latency p95 <= 1500ms

### Go / No-Go Gate (required)

- `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go`

What it checks (`scripts/go-no-go-check.ts`):

- `/api/monitoring/perf-status` returns `ok`, including the required `/api/assignments` latency sample gate.
- Evidence files exist:
  - `RLS_DEPLOYMENT_SUMMARY.md`
  - `ACCESSIBILITY_AUDIT_REPORT.md`
- Current launch smoke evidence is fresh for the target.
- Production-candidate restore report evidence exists and is fresh for non-local targets.
- Authenticated `/api/monitoring/launch-status` reports the full launch monitor contract as ready.

## Target Runbook

1. Ensure the intended production-candidate app is healthy:
   - `npm run build`
   - `npm run start`
2. Run budgets:
   - `BASE_URL=<production-candidate-url> npm run perf:budgets`
3. Capture restore evidence for the same production-candidate data checkpoint:
   - `npm run db:backup:checkpoint`
   - `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`
4. Run go/no-go:
   - `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run go:no-go`

## Optional Deeper Analysis

- Lighthouse ad-hoc: run against target URLs for diagnostics.
- Load tests (non-gating): `tests/load/*` assets for additional stress scenarios.

## CI Parity

CI runs performance and go/no-go gates after booting production build output. Keep this file and `agent/checklists/verification.md` aligned when thresholds change.
