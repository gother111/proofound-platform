> Doc Class: `active`
> Last Verified: `2026-02-26`

# Performance Testing Guide

## Scope

This guide covers the enforced performance gates used for release readiness.

## Canonical Commands

### Budget Gate (required)

- `BASE_URL=http://localhost:3000 npm run perf:budgets`

What it checks (`scripts/perf-budgets.mjs`):

- Lighthouse Desktop TTI <= 12000ms
- Lighthouse Mobile TTI <= 6500ms
- Lighthouse CLS <= 0.95
- `/api/health` latency p95 <= 1500ms

### Go / No-Go Gate (required)

- `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`

What it checks (`scripts/go-no-go-check.mjs`):

- `/api/monitoring/perf-status` returns `ok`
- `SUS_STUDY_COMPLETE=true`
- Evidence files exist:
  - `RLS_DEPLOYMENT_SUMMARY.md`
  - `ACCESSIBILITY_AUDIT_REPORT.md`

## Local Runbook

1. Ensure app is healthy:
   - `npm run build`
   - `npm run start`
2. Run budgets:
   - `BASE_URL=http://localhost:3000 npm run perf:budgets`
3. Run go/no-go:
   - `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`

## Optional Deeper Analysis

- Lighthouse ad-hoc: run against target URLs for diagnostics.
- Load tests (non-gating): `tests/load/*` assets for additional stress scenarios.

## CI Parity

CI runs performance and go/no-go gates after booting production build output. Keep this file and `agent/checklists/verification.md` aligned when thresholds change.
