> Doc Class: `active`
> Last Verified: `2026-02-26`

# Admin Dashboard Testing Guide

## Canonical Automated Commands

### API/Data Contract Probe

```bash
export NEXT_PUBLIC_APP_URL=http://localhost:3000
node scripts/test-admin-dashboard-data.js
```

### Admin Smoke (Playwright)

```bash
node ./scripts/playwright-node20.mjs test e2e/admin-dashboard-smoke.spec.ts --project=chromium --reporter=line
```

## Required Routes

- `/admin`
- `/admin/users`
- `/admin/organizations`
- `/admin/verification`
- `/admin/fairness`
- `/admin/fairness/notes`

## Manual Checklist

### Access Control

- [ ] Admin user can access core admin routes.
- [ ] Non-admin user receives access denial (`/403` or redirect).

### Dashboard Health

- [ ] Overview cards render numeric values safely.
- [ ] Growth and analytics sections load without blocking errors.
- [ ] Fairness section loads for authorized roles.
- [ ] Loading and error states are user-readable.

### Data Integrity

- [ ] API responses for admin analytics endpoints are structurally valid.
- [ ] No `NaN` or undefined numeric output in cards/charts.

## Common Failure Modes

- Missing admin auth/session context.
- Missing seed data in local env.
- Route-level permission regressions.

## Canonical References

- `e2e/admin-dashboard-smoke.spec.ts`
- `scripts/test-admin-dashboard-data.js`
- `agent/checklists/verification.md`
