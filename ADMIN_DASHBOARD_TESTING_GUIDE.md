> Doc Class: `active`
> Last Verified: `2026-05-19`

# Admin Launch Ops Testing Guide

This guide covers the active admin/internal-ops launch corridor. The old broad
admin dashboard, user-management dashboard, organization-management dashboard,
fairness dashboard, analytics cards, and vanity metric probes are archived or
post-MVP. They are not launch evidence.

## Active Admin Corridor

- `/admin` - protected launch-ops landing with only operations queues, audit log,
  and internal CV OCR status.
- `/admin/verification` - protected internal operations queues for verification,
  privacy/reveal disputes, redaction/risky uploads, and pilot follow-through.
- `/admin/audit` - protected admin action history for dispute and trust-incident
  traceability.

## Canonical Automated Checks

Run the focused admin launch checks:

```bash
npm run test -- tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/admin-verification-dashboard.test.tsx tests/ui/admin-audit-log-table.test.tsx tests/api/admin-internal-ops-queue-route.test.ts tests/api/launch-page-inventory.test.ts tests/lib/admin-break-glass.test.ts tests/api/org-audit-export-routes.test.ts
```

Run the active Playwright route smoke only when the mock admin environment is
explicitly enabled:

```bash
NEXT_PUBLIC_USE_MOCK_SUPABASE=true MOCK_ADMIN_MODE=true npm run test:e2e -- e2e/admin-dashboard-smoke.spec.ts --project=chromium --reporter=line
```

Optional local API probe for a running dev server:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000 node scripts/test-admin-dashboard-data.js
```

## Manual Checklist

### Access Control

- [ ] Non-admin users cannot see `/admin`, `/admin/verification`, or `/admin/audit`.
- [ ] Public and logged-out users do not see queue content, audit entries, admin
      emails, internal notes, provider details, or extracted proof text.
- [ ] Admin pages fail closed if the admin session is missing or downgraded.

### Launch Ops Landing

- [ ] `/admin` explains that this is restricted launch operations, not a generic
      platform dashboard.
- [ ] The only primary actions are `Open operations queues` and `Open audit log`.
- [ ] The CV OCR status is minimal and does not expose provider secrets,
      processor IDs, extracted content, or raw diagnostics.

### Operations Queues

- [ ] `/admin/verification` makes the primary object obvious: operations queue
      items that need manual review.
- [ ] The queue families remain narrow: `verification`,
      `privacy_reveal_exception`, `correction_revocation`, and `pilot_ops`.
- [ ] Empty, loading, error, disabled, and success/transition states are readable.
- [ ] Queue cards show enough anchor context for action without leaking private
      proof content beyond the admin-only review context.
- [ ] The primary next action is obvious for each actionable queue item.

### Audit Logs

- [ ] `/admin/audit` makes the primary object obvious: protected admin action
      history.
- [ ] Search, pagination, loading, empty, and error states are readable.
- [ ] Break-glass organization audit access requires an explicit reason and logs
      the admin action.
- [ ] Audit export/read paths stay internal-only and do not expose public
      diagnostics.

### Responsive Smoke

- [ ] Desktop layout stays calm and task-focused.
- [ ] Mobile layout keeps navigation reachable and avoids overlapping sidebar,
      header, queue cards, and table content.

## Route Classification

| Surface                 | Classification           | Launch expectation                              |
| ----------------------- | ------------------------ | ----------------------------------------------- |
| `/admin`                | internal-only launch ops | Protected landing with no broad dashboard links |
| `/admin/verification`   | internal-only launch ops | Narrow queue review                             |
| `/admin/audit`          | internal-only launch ops | Protected audit trail                           |
| `/admin/users`          | archived/post-MVP        | Must not be linked or used as launch evidence   |
| `/admin/organizations`  | archived/post-MVP        | Must not be linked or used as launch evidence   |
| `/admin/fairness`       | archived/post-MVP        | Must not be linked or used as launch evidence   |
| `/admin/fairness/notes` | archived/post-MVP        | Must not be linked or used as launch evidence   |

## Canonical References

- `docs/internal-ops/index.md`
- `docs/launch-operations-mvp.md`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`
- `tests/ui/admin-dashboard-launch-links.test.tsx`
- `tests/ui/admin-verification-dashboard.test.tsx`
- `tests/ui/admin-audit-log-table.test.tsx`
- `tests/api/admin-internal-ops-queue-route.test.ts`
- `tests/api/launch-page-inventory.test.ts`
- `tests/lib/admin-break-glass.test.ts`
- `tests/api/org-audit-export-routes.test.ts`
