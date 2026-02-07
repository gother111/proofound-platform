# QA Summary

This document is the running summary for the end-to-end QA automation effort.

References:

- `docs/qa/e2e-matrix.md` (flows and actor matrix)
- `docs/qa/bugs.md` (bug log)
- Verification checklist: `agent/checklists/verification.md`

## What Was Tested

- Public pages accessibility:
  - `/`
  - `/login`
  - `/signup`
- Authentication flows in mock mode:
  - Signup (individual, organization)
  - Login
  - Password reset (UI flow)
  - Email verification (UI flow)

## What Was Automated

- Accessibility (axe-core + Playwright): `npm run test:a11y`
  - Tests live in `tests/a11y/*`
- Auth E2E (mock Supabase): `npm run test:e2e:auth`
  - Tests live in `e2e/auth.spec.ts`

## Bugs Found

See `docs/qa/bugs.md` for full details.

Fixed in this pass so far:

- Skip link focus target was missing on public pages.
- Footer icon-only links lacked accessible names.
- Auth pages had WCAG contrast violations.
- A11y scans were unstable during animations.
- Mock E2E login helper used an ambiguous password selector.
- Mock Supabase query chain lacked `.or()` which crashed `/api/interviews/schedule` in mock mode.

Open risks:

- `npm run db:push` currently fails due to Drizzle dependency mismatch.
- Login page includes hardcoded localhost ingest debug calls.
- Playwright CI workflow likely needs a DB service when using a local `DATABASE_URL` fallback.

## Next Steps (Planned)

- Implement deterministic smoke E2E for:
  - Individual shell navigation
  - Org shell navigation and role enforcement
  - Admin dashboard access and core lists
- Add a CI-friendly E2E command that provisions dependencies (local Postgres) and runs smoke tests headless.
