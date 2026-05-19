> Doc Class: `active`
> Last Verified: `2026-05-19`

# Release Checklist

Use this checklist as the short release operator view. The current detailed source is
[`docs/production-readiness-checklist.md`](production-readiness-checklist.md), the phase gate is
[`docs/backlog/phase-exit-checklist.md`](backlog/phase-exit-checklist.md), and the current sweep
evidence lives at
[`../.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`](../.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md).

Current 2026-05-19 status: local surface, route-policy, strict org, launch smoke, local monitor,
restore-contract, docs-freshness, and public Browser fallback evidence exists. Do not treat this
checklist as launch complete until the intended production-candidate target has fresh backup
checkpoint, isolated restore rehearsal, authenticated launch-monitor/perf evidence, and final
go/no-go evidence.

## 1) Pre-Release Validation

### Required Gates

- [ ] `npm run audit:prod`
- [ ] `npm run audit:all`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run test:launch:smoke`
- [ ] `npm run test:e2e:landing`
- [ ] `npm run test:e2e:auth:real`
- [ ] `npm run test:a11y:strict`
- [ ] `npm run test:strict:quality`
- [ ] `npm run test:e2e:individual:strict`
- [ ] `npm run test:e2e:org:strict`
- [ ] `npm run test:e2e:privacy:strict`
- [ ] `npm run test:e2e:providers:strict`
- [ ] `BASE_URL=<production-candidate-url> CRON_SECRET=<secret> npm run monitor:launch`
- [ ] `BASE_URL=<production-candidate-url> npm run perf:budgets`
- [ ] `npm run db:backup:checkpoint` against the production-candidate target.
- [ ] `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json` against an isolated recovery target.
- [ ] `BASE_URL=<production-candidate-url> SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go`

### Optional Consolidated Runner

- [ ] `npm run gates:mvp:strict -- --env-file .env.local --port 40123`

## 2) Manual Smoke

- [ ] Landing page loads and no critical console/runtime errors.
- [ ] Individual shell basic navigation works (`/app/i/*`).
- [ ] Organization shell basic navigation works (`/app/o/<slug>/*`).
- [ ] Admin smoke checks pass (`/admin`, core sections).

### Revamp Stabilization Regression Smoke (PRO-119)

- [ ] Command palette opens via `Cmd+K`, remains open during in-panel interaction, and closes with Escape.
- [ ] Dashboard guided tour/spotlight trigger works in provider-wrapped layouts and non-provider render contexts do not crash.
- [ ] Individual matching blocked-state renders expected gated UI and no request-order dependency regressions.
- [ ] Interview scheduling flow supports manual links and any intentionally configured provider paths with valid default slot selection.
- [ ] Validation evidence is aligned with `project/changes/entries/2026-03-01T09-42-33Z__master__d9a1a144.md`.

## 3) Data and Migration Safety

- [ ] `npm run db:drift-check`
- [ ] If migrations changed: `npm run db:migrate`
- [ ] Do not use `npm run db:push` for production workflows.
- [ ] Confirm the intended database target before running backup or restore scripts.
- [ ] Confirm the restore report used by final `go:no-go` matches the checkpoint above.
- [ ] Restore drill outcome is saved with date, target class, and owner.

## 4) Production Readiness Signals

- [ ] Required evidence files present:
  - `RLS_DEPLOYMENT_SUMMARY.md`
  - `ACCESSIBILITY_AUDIT_REPORT.md`
- [ ] Monitoring stack configured and healthy.
- [ ] Authenticated `/api/monitoring/launch-status` reports ready for the intended target.
- [ ] Authenticated `/api/monitoring/perf-status` is healthy and includes `/api/assignments` latency samples.
- [ ] `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=false` unless connected-provider scheduling is intentionally launch-blocking for the target.
- [ ] Provider credentials and strict E2E env vars validated only for provider flows intentionally in scope for the run; manual-link interview posture remains the locked MVP default.
- [ ] `CRON_SECRET` or `INTERNAL_API_SECRET` protects internal launch-ops routes.

## 5) Post-Deploy Checks

- [ ] `curl -sS https://proofound.io/api/health`
- [ ] Confirm public health returns only `status` and `timestamp`.
- [ ] Confirm deployed Vercel deployment metadata matches the expected commit SHA.
- [ ] Review Sentry and runtime logs for regressions.

## Canonical References

- `agent/checklists/verification.md`
- `agent/runbooks/setup.md`
- `docs/testing-strategy.md`
- `docs/qa/e2e-matrix.md`
