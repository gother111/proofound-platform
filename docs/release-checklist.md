> Doc Class: `active`
> Last Verified: `2026-02-26`

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
- [ ] Confirm deployed version matches expected commit SHA.
- [ ] Review Sentry and runtime logs for regressions.

## Canonical References

- `agent/checklists/verification.md`
- `agent/runbooks/setup.md`
- `docs/testing-strategy.md`
- `docs/qa/e2e-matrix.md`
