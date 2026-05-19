> Doc Class: `active`
> Last Verified: `2026-05-19`

# QA Bug Log

Status values are normalized to: `open`, `fixed`, `monitoring`, `wontfix`.

## Fixed

### B-001 Missing skip-link focus target on public pages

- Severity: high
- Status: fixed
- Regression: `tests/a11y/keyboard-navigation.spec.ts`

### B-002 Icon-only footer links missing accessible names

- Severity: medium
- Status: fixed
- Regression: `tests/a11y/critical-flows.spec.ts`

### B-003 Contrast failures on auth pages

- Severity: high
- Status: fixed
- Regression: `tests/a11y/critical-flows.spec.ts`

### B-004 A11y scan instability during fade-in animation

- Severity: medium
- Status: fixed
- Regression: `tests/a11y/critical-flows.spec.ts`

### B-005 Mock auth helper matched wrong password target

- Severity: medium
- Status: fixed
- Regression: `e2e/auth.spec.ts`

### B-006 Mock Supabase query chain missing `.or()`

- Severity: high
- Status: fixed
- Regression: `tests/api/*` and mock-mode E2E contracts

## Open

### B-007 Drizzle dependency mismatch impacts `npm run db:push`

- Severity: high
- Status: open
- Scope: dev convenience workflow only, not production migration path.
- Canonical path: use SQL migrations + `npm run db:migrate`.

### B-008 Login page debug localhost ingest calls

- Severity: medium
- Status: fixed
- Regression: `tests/scripts/launch-gate-config.test.ts`
- Evidence: `src/app/(auth)/login/page.tsx`, `src/lib/debug-ingest.ts`, and `.env.example` now use an optional env-driven debug ingest sink. No hardcoded localhost ingest endpoint is present in the active login path.

### B-009 Playwright workflow DB fallback without DB service

- Severity: high
- Status: open
- Scope: CI reliability for Playwright workflow configuration.

### B-010 Monitoring endpoint JSON parse warnings during browser tests

- Severity: low
- Status: monitoring
- Notes: commonly observed during test teardown, requires production-behavior confirmation.

## Triage Policy

- New issues must include:
  - Severity
  - Status
  - Repro command or route
  - Suspected owner area
  - Linked test path when available
- Launch-blocking issues must identify whether the affected surface is active MVP, internal-only launch ops, archived, or post-MVP.
- Browser/manual visual findings should include route, viewport, role/mode, and whether the finding affects the locked MVP corridor.
