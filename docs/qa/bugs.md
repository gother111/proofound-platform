# QA Bug Log

Format per issue:

- Title
- Severity: blocker | high | medium | low
- Status: open | fixed
- Steps to reproduce
- Expected vs actual
- Notes (suspected area, logs, links to tests, etc)

## Fixed

### A11y: Missing skip link focus target on public pages

- Severity: high
- Status: fixed
- Steps to reproduce:
  - Open `/`
  - Press `Tab` until "Skip to main content" is focused
  - Press `Enter`
- Expected: focus moves to the main content region.
- Actual: no focus target, keyboard flow breaks.
- Fix:
  - Added skip link component and `#main-content` focus target.
  - Regression: `tests/a11y/keyboard-navigation.spec.ts`.

### A11y: Icon-only footer links fail accessible name checks

- Severity: medium
- Status: fixed
- Steps to reproduce:
  - Run axe scan on `/`
- Expected: all links have accessible names.
- Actual: footer social links were icon-only and flagged by axe.
- Fix:
  - Added `aria-label` and `title` to footer social links.
  - Regression: `tests/a11y/critical-flows.spec.ts`.

### A11y: Auth pages had contrast violations (placeholders and muted copy)

- Severity: high
- Status: fixed
- Steps to reproduce:
  - Run axe scan on `/login` and `/signup`
- Expected: WCAG AA contrast for foreground text.
- Actual: low-contrast placeholder overrides and muted copy failed.
- Fix:
  - Removed low-contrast placeholder overrides and adjusted muted copy styling.
  - Regression: `tests/a11y/critical-flows.spec.ts`.

### A11y Tests: Scan ran during fade-in animations causing false-positive contrast violations

- Severity: medium
- Status: fixed
- Steps to reproduce:
  - Run `npm run test:a11y` repeatedly.
- Expected: stable results.
- Actual: contrast failures triggered when axe ran mid-animation (Framer Motion opacity transition).
- Fix:
  - Added a deterministic "UI settle" wait before scanning in `tests/a11y/critical-flows.spec.ts`.

### E2E: Mock login helper used ambiguous label selector for password

- Severity: medium
- Status: fixed
- Steps to reproduce:
  - Run `NEXT_PUBLIC_USE_MOCK_SUPABASE=true npm run test:e2e -- --project=chromium`
- Expected: helper fills password input.
- Actual: `getByLabel(/password/i)` matched both password input and "Show password" button and failed in strict mode.
- Fix:
  - Updated `e2e/helpers/auth.ts` to target `input[name="password"]`.

### Mock Supabase: Missing query chain method `.or()` caused server route crashes

- Severity: high
- Status: fixed
- Steps to reproduce:
  - Run with `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`
  - Visit `/app/i/interviews` (calls `/api/interviews/schedule`)
- Expected: route returns an empty list when no interviews exist.
- Actual: server throws `TypeError: ... .or is not a function`.
- Fix:
  - Added `.or()` to mock Supabase query chains in `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts`.

## Open

### DB Setup: `npm run db:push` fails due to Drizzle version mismatch

- Severity: high
- Status: open
- Steps to reproduce:
  - Set `DATABASE_URL` to a running Postgres instance
  - Run `npm run db:push`
- Expected: schema sync completes.
- Actual: drizzle-kit prints: "requires newer version of drizzle-orm".
- Notes:
  - Workaround: `npm run db:migrate` applies `migrations-to-run.sql` and succeeds for local Postgres.
  - Fix likely requires dependency alignment (needs explicit approval before changing versions).

### Login page contains hardcoded debug "agent log" network calls

- Severity: medium
- Status: open
- Steps to reproduce:
  - Visit `/login`
  - Observe network calls to `http://127.0.0.1:7242/ingest/...`
- Expected: no hardcoded calls to localhost ingest endpoints.
- Actual: page includes debug `fetch(...)` blocks.
- Suspected area: `src/app/(auth)/login/page.tsx`.
- Notes:
  - This is in an auth entrypoint; removing or gating it should be done carefully.

### CI: Playwright workflow references local Postgres fallback without starting a DB

- Severity: high
- Status: open
- Steps to reproduce:
  - Run `.github/workflows/playwright.yml` without `DATABASE_URL` secret
- Expected: workflow provisions a Postgres service or avoids DB usage.
- Actual: it exports a local `DATABASE_URL` value but does not start Postgres.
- Notes:
  - Likely needs a GitHub Actions service container or explicit `docker compose up -d`.

### Observability endpoint logs JSON parse errors during Playwright runs

- Severity: low
- Status: open
- Symptoms:
  - Dev server logs show `web_vitals.record.failed` and `Unexpected end of JSON input` during browser test runs.
- Notes:
  - May be due to aborted requests during test teardown; confirm if this happens in normal usage.
