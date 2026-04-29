> Doc Class: `active`
> Last Verified: `2026-03-01`

# Release Checklist

## 1) Pre-Release Validation

### Required Gates

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run test:e2e:landing`
- [ ] `npm run test:e2e:auth:real`
- [ ] `npm run test:a11y:strict`
- [ ] `npm run test:strict:quality`
- [ ] `npm run test:e2e:individual:strict`
- [ ] `npm run test:e2e:org:strict`
- [ ] `npm run test:e2e:privacy:strict`
- [ ] `npm run test:e2e:providers:strict`
- [ ] `BASE_URL=http://localhost:3000 npm run perf:budgets`
- [ ] `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`

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
- [ ] Interview scheduling flow supports manual and provider paths with valid default slot selection.
- [ ] Validation evidence is aligned with `project/changes/entries/2026-03-01T09-42-33Z__master__d9a1a144.md`.

## 3) Data and Migration Safety

- [ ] `npm run db:drift-check`
- [ ] If migrations changed: `npm run db:migrate`
- [ ] Do not use `npm run db:push` for production workflows.

## 4) Production Readiness Signals

- [ ] Required evidence files present:
  - `RLS_DEPLOYMENT_SUMMARY.md`
  - `ACCESSIBILITY_AUDIT_REPORT.md`
- [ ] Monitoring stack configured and healthy.
- [ ] Provider credentials and strict E2E env vars validated.

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
