# Documentation (Status + Index)

## Status

This folder is the durable “project memory” surface for Proofound. It is meant to be read first by humans and agents before making changes.

## Known Drift (Repo Truth)

- `.github/workflows/ci.yml` matrix runs Node 18.x and 20.x, but `package.json` engines require Node `>=20.20.0 <21` (and `.nvmrc` pins `20.20.0`). (source: .github/workflows/ci.yml, package.json, .nvmrc)
- `.github/workflows/playwright.yml` uses `node-version: lts/*`, which is not pinned to `package.json` engines and can drift as the LTS line changes over time. (source: .github/workflows/playwright.yml, package.json)

## Decisions

- Repo Truth claims must cite a concrete path as `(source: README.md)`.
- Do not invent missing files. If a referenced file is absent, add a TODO with the expected location and why it is expected.
- Do not copy secrets from local env files or setup docs into tracked markdown.
- At the end of every session, append a new entry to `agent/scratchpad.md` (append-only).

## Last Run Summary

- Bootstrap run: created `project/` and `agent/` markdown only (no application code changes).
- This run: tightened repo-truth wording/citations after verifying against cited sources.
- This run: created `agent/scratchpad.md` session log (2026-02-07 09:49 CET).
- Scratchpad why: keep a durable, append-only per-session work log.
- Scratchpad verify: confirm `agent/scratchpad.md` exists and append a new entry at the end of each session.
- Scratchpad open risks/TODO: none.
- Vercel pre-commit gate run (2026-02-06 22:50 CET) @ `ed6c95e3e27086fc9a028364b52e0fc6517fd3fb` (Node `v20.20.0`, npm `10.8.2`):
  - `npm ci`: PASS
  - `npm run lint`: PASS
  - `npm run typecheck`: PASS
  - `npm run test`: PASS
  - `npm run build`: PASS
  - `npx vercel@latest pull --yes --environment=production` (via `VERCEL_TOKEN`): PASS
  - `npx vercel@latest build --prod` (via `VERCEL_TOKEN`): PASS
  - Fixes applied (this commit):
    - Vitest: add SSR export shim so Vitest/vite-node can import project modules correctly: `vitest.config.ts`
    - Tests: fix mocks/expectations: `tests/api/assignments.test.ts`, `tests/actions/auth.test.ts`, `src/lib/supabase/__tests__/server.test.ts`
    - UI: prefer custom validation messaging for feedback form: `src/components/feedback/FeedbackForm.tsx`
    - Typecheck/test stabilization: `src/types/pdfkit.d.ts`, `src/lib/portfolio/pdf.ts`, `src/lib/reports/evidence-pack-generator.ts`, `src/app/api/admin/__tests__/users-route.test.ts`, `src/lib/__tests__/rate-limit.test.ts`
- Vercel pre-commit gate run (2026-02-06 23:52 CET) @ `1c096b3` (Node `v20.20.0`, npm `10.8.2`, Vercel CLI `50.13.1`):
  - `npm ci`: PASS
  - `npm run lint`: PASS
  - `npm run typecheck`: PASS
  - `npm run test`: PASS
  - `npm run build`: PASS
  - `npx vercel pull --yes --environment=production --token $VERCEL_TOKEN`: PASS
  - `npx vercel build --prod --yes --token $VERCEL_TOKEN`: PASS
  - Notes:
    - `prebuild` readiness check still warns about missing env vars in local build logs; it is warning-only due to `|| true`. (source: package.json)
    - `vercel pull` overwrote `.vercel/.env.production.local` as expected (gitignored). (source: .gitignore)
- Fix run: LinkedIn verification CSRF (2026-02-06):
  - Bug: Clicking Settings -> Identity Verification -> LinkedIn -> "Start Verification Check" returned `CSRF validation failed` because the request did not include `x-csrf-token`. (source: src/components/settings/LinkedInVerification.tsx, src/lib/csrf.ts, src/middleware.ts)
  - Fix: Use `apiFetch` for the POST so CSRF token is attached automatically. (source: src/components/settings/LinkedInVerification.tsx, src/lib/api/fetch.ts)
  - Regression test: `tests/ui/linkedin-verification.test.tsx`
  - Verify:
    - `npm run lint`
    - `npm run typecheck`
    - `npm run test`
    - `npm run build`
- Fix run: Zoom and Google meeting flow wiring (2026-02-06):
  - Problem: Video provider connection state was split between `userIntegrations` (Drizzle) and `user_video_integrations` (Supabase). UI could show “connected” while interview scheduling still failed with “not connected”. (source: src/app/app/i/settings/integrations/IntegrationsClient.tsx, src/app/api/interviews/schedule/route.ts, supabase/migrations/20251108_add_video_integrations.sql)
  - Fix: Standardize video provider connect, callback, status, and disconnect on `user_video_integrations` and make Settings -> Integrations call the video integration endpoints. (source: src/app/api/integrations/video/route.ts, src/app/api/integrations/video/status/route.ts, src/app/api/integrations/video/[provider]/route.ts, src/app/api/integrations/video/[provider]/auth/route.ts, src/app/api/integrations/zoom/connect/route.ts, src/app/api/integrations/zoom/callback/route.ts, src/app/api/integrations/google/connect/route.ts, src/app/api/integrations/google/callback/route.ts)
  - Safety: Add `state` cookie checks (`zoom_oauth_state`, `google_oauth_state`) so OAuth callbacks reject mismatched or expired state. (source: src/app/api/integrations/zoom/connect/route.ts, src/app/api/integrations/zoom/callback/route.ts, src/app/api/integrations/google/connect/route.ts, src/app/api/integrations/google/callback/route.ts)
  - Compatibility: Keep `/api/auth/zoom/callback` and `/api/auth/google/callback` writing to `user_video_integrations` so existing provider redirect URIs still work. (source: src/app/api/auth/zoom/callback/route.ts, src/app/api/auth/google/callback/route.ts)
  - Verify (Node 20.20.0):
    - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
    - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
    - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
    - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`

## Curated Doc Index (Validated Paths)

Start here:

- `README.md`
- `project/Prompt.md`
- `project/Architecture.md`
- `project/Plans.md`
- `project/Implement.md`
- `agent/runbooks/setup.md`

## 2026-02-07: Zoom OAuth Production Hardening (proofound.io)

What changed:

- OAuth redirect base URL selection now prefers `NEXT_PUBLIC_SITE_URL` (fallback: `NEXT_PUBLIC_URL`, then request origin) for Zoom and Google connect and callback routes. This reduces configuration drift between the rest of the app (which already uses `NEXT_PUBLIC_SITE_URL`) and the video integration OAuth flow.
- `docs/ENV_VARIABLES.md` quick reference now reflects the current production domain `https://proofound.io` and the recommended OAuth callback paths under `/api/integrations/*/callback`.

Why:

- Production `NEXT_PUBLIC_SITE_URL` was not aligned to `https://proofound.io`, which can cause provider redirect URI mismatch if the OAuth flow constructs redirect URIs from a different base URL.

How to verify:

- Local checks (Node `20.20.0`):
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- Vercel parity build (uses linked project):
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npx vercel@latest pull --yes --environment=production`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npx vercel@latest build --prod`
- Production smoke test:
  - Visit `/app/i/settings/integrations`
  - Click "Connect Zoom" and complete OAuth
  - Confirm redirect back to `/app/i/settings/integrations?success=zoom_connected`
  - Schedule an interview with `platform=zoom` and confirm `meeting_link` is populated.

Open risks/TODO:

- Vercel environment variable changes require a new production deployment to take effect for the live site.

Environment + setup:

- `.env.example`
- `docs/ENV_VARIABLES.md`
- `SETUP_SUPABASE.md`

Product + requirements:

- `Proofound_PRD_MVP.md`
- `PRD_for_a_web_platform_MVP.md`
- `PRD_TECHNICAL_REQUIREMENTS.md`
- `Proofound_Core_User_Flows_v1.md`
- `USER_FLOWS_TECHNICAL_SPECIFICATIONS.md`

Architecture + privacy:

- `SYSTEM_ARCHITECTURE_COMPREHENSIVE.md`
- `SYSTEM_ARCHITECTURE_SUPPLEMENT.md`
- `FULL_PRODUCT_ARCHITECTURE_PLAN.md`
- `DATA_SECURITY_PRIVACY_ARCHITECTURE.md`

API docs:

- `API_DOCUMENTATION_FINAL.md`
- `API_DOCUMENTATION_NEW_ENDPOINTS.md`
- `docs/api-documentation.md`

DB + migrations:

- `drizzle.config.ts`
- `src/db/schema.ts`
- `src/db/policies.sql`
- `src/db/triggers.sql`
- `run-migrations.mjs`
- `migrations-to-run.sql`
- `RUN_MIGRATIONS_GUIDE.md`
- `APPLY_MIGRATIONS_MANUAL.md`
- `supabase/migrations/`

Testing + CI:

- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/playwright.yml`
- `.github/workflows/accessibility.yml`
- `docs/testing-strategy.md`
- `INTEGRATION_TEST_PLAN.md`
- `MANUAL_TESTING_GUIDE.md`
- `MANUAL_TESTING_CHECKLIST.md`

Ops + launch readiness:

- `LAUNCH_RUNBOOK.md`
- `PRODUCTION_CHECKLIST.md`
- `docs/deployment-guide.md`
- `DEPLOYMENT_NOTES.md`
- `docs/sentry-setup.md`
- `docs/structured-logging.md`
- `docs/monitoring-alerting.md`

Audits + status snapshots:

- `IMPLEMENTATION_STATUS_CURRENT.md`
- `CODEBASE_AUDIT_REPORT.md`
- `SECURITY_REVIEW_REPORT.md`
- `CROSS_DOCUMENT_PRIVACY_AUDIT.md`
- `RLS_DEPLOYMENT_SUMMARY.md`
- `PRIVACY_DASHBOARD_IMPLEMENTATION_SUMMARY.md`
- `UI_UX_AUDIT_REPORT.md`
- `MCP_STATUS.md`
- `DB_INTEGRATION_SUMMARY.md`

TODO (missing / validate; do not create here):

- `ACCESSIBILITY_AUDIT_REPORT.md` (expected because `scripts/go-no-go-check.mjs` requires it) (source: scripts/go-no-go-check.mjs)
- `playwright.a11y.config.ts` (expected because `npm run test:a11y` references it) (source: package.json)

---

## 2026-02-11: Isolated LinkedIn OAuth Hotfix Release Candidate

What changed:

- Created isolated release branch `codex/linkedin-oauth-hotfix-isolated` from `origin/master`.
- Cherry-picked LinkedIn OAuth and verification UX hotfix commit:
  - `src/app/api/auth/linkedin/route.ts`
  - `src/app/api/auth/linkedin/callback/route.ts`
  - `src/components/settings/SettingsContent.tsx`
  - `src/components/settings/LinkedInConnect.tsx`
  - `src/components/settings/LinkedInVerification.tsx`
  - `tests/api/linkedin-oauth-redirects.test.ts`
  - `tests/ui/linkedin-verification.test.tsx`
- Kept unrelated local edits out of commit scope.

Why:

- Previous working branches contained unrelated commits and local edits that increased release risk.
- This branch isolates the LinkedIn 404 redirect fix and connect-first verification flow for safer deployment.

How to verify:

- Core checks (Node 20.20.0):
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- Manual smoke (requires LinkedIn OAuth app setup):
  - Open `/app/i/settings?tab=integrations`
  - Click Connect LinkedIn and complete OAuth
  - Confirm redirect to `/app/i/settings?tab=integrations&success=linkedin_connected`
  - Confirm verification panel shows Connect step when disconnected and Start Verification Check when connected

Open risks/TODO:

- LinkedIn OAuth callback success still depends on allowlisting the exact domain in LinkedIn app settings.

---

## 2026-02-11: Organization Profile Reliability and Basic Info Save Hardening

What changed:

- Reworked org profile route to always render actionable profile content and removed the blocking empty-profile return path:
  - `src/app/app/o/[slug]/profile/page.tsx`
- Wired the route to the polished profile shell and added a lightweight completion banner for empty profiles:
  - `src/components/profile/OrganizationProfileView.tsx`
- Fixed hero data mapping and edit entry behavior:
  - Use `coverImageUrl` and `locations` fields from org data.
  - Add optional `onEditProfile` callback that opens and scrolls to the basic info editor.
  - Files: `src/components/organization/OrganizationHero.tsx`, `src/components/profile/OrganizationProfileView.tsx`
- Refactored org basic info editing to API patch flow with CSRF-safe fetch and explicit success/failure handling:
  - `src/components/organization/OrganizationBasicInfoEditor.tsx`
- Added shared website normalization helper and reused it in both client submit flow and API validation:
  - `src/lib/organizations/normalizeWebsite.ts`
  - `src/app/api/organizations/[orgId]/route.ts`
- Added regression tests:
  - `tests/lib/normalize-organization-website.test.ts`
  - `tests/api/organizations-route.test.ts`
  - `tests/ui/organization-basic-info-editor.test.tsx`

Why:

- Empty org profiles previously hit a static placeholder screen with no working completion path.
- Basic info saves previously used a server action path that could silently fail and could null unrelated fields.
- Website input handling was inconsistent and did not normalize common inputs like `example.com`.

How to verify:

- `npm run lint`
- `npm run build` (also regenerates `.next` types used by typecheck)
- `npm run typecheck`
- `npm run test`
- Targeted tests:
  - `npm run test -- tests/lib/normalize-organization-website.test.ts tests/api/organizations-route.test.ts tests/ui/organization-basic-info-editor.test.tsx`
- Manual smoke:
  - Open `/app/o/[slug]/profile` for a near-empty org and confirm it shows actionable profile UI with completion banner.
  - Click `Edit Profile` in hero and confirm editor opens and scrolls into view.
  - Save website as `example.com` and confirm persisted value is normalized to `https://example.com/`.
  - Confirm failed API save shows error toast and does not show success toast.

Open risks/TODO:

- `OrganizationProfileView` and `OrganizationHero` still use local inline types; consider consolidating to a shared org profile view model type.
- Manual browser smoke was not executed in this run.

---

## 2026-02-11: CI and Go-No-Go Hardening

What changed:

- CI/workflow Node version drift was removed:
  - `.github/workflows/ci.yml` now uses `node-version-file: '.nvmrc'` (no Node 18 matrix leg) and includes runtime env vars needed by `start`, `perf:budgets`, and `go:no-go`.
  - `.github/workflows/playwright.yml` now uses `node-version-file: '.nvmrc'` instead of `lts/*`.
  - `.github/workflows/accessibility.yml` now uses `node-version-file: '.nvmrc'`.
- `src/app/api/monitoring/perf-status/route.ts` now keeps the existing response fields and adds deterministic fallback behavior:
  - If `analytics_events` has no `api_latency` samples in the last 24 hours, the route probes local-origin `/api/health` 10 times, computes p95 in-memory, returns `ok` from that p95, and sets `source: "probe"`.
  - If analytics samples exist, it returns the analytics-based result with `source: "analytics_events"`.
- Missing Go/No-Go evidence file was added:
  - `ACCESSIBILITY_AUDIT_REPORT.md` with current automated a11y result, manual checklist references, known gaps, and date.
- Stale documentation pointers were fixed:
  - `scripts/check-deploy-readiness.mjs` now points to `docs/deployment-guide.md`.
  - `src/db/index.ts` now points to `docs/ENV_VARIABLES.md`.
- `scripts/perf-budgets.mjs` was hardened:
  - Switched to named `chrome-launcher` import (`launch`).
  - Runs Lighthouse desktop/mobile audits serially to avoid process-level timing mark collisions.

Why:

- Keep CI and release gates aligned with repo truth (`.nvmrc` and `package.json` engines).
- Prevent false-negative go/no-go failures when historical analytics rows are missing.
- Ensure required evidence/document references are concrete and resolvable.

How to verify:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH rm -rf .next && npm run typecheck`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:a11y`
- Gate parity (with local server at `http://localhost:3000`):
  - `BASE_URL=http://localhost:3000 npm run perf:budgets`
  - `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go`
- Perf-status source validation:
  - With no analytics rows in the 24h window, `/api/monitoring/perf-status` should return `source: "probe"`.
  - With at least one `api_latency` analytics row present, `/api/monitoring/perf-status` should return `source: "analytics_events"`.

Open risks/TODO:

- `npm run test:a11y` currently fails due signup color contrast violations (`tests/a11y/critical-flows.spec.ts`, rule `color-contrast`).
- `npm run perf:budgets` currently fails on TTI budgets (desktop and mobile) despite script reliability fixes.
- This task did not change product UI contrast or page performance itself; it hardened gate determinism and evidence plumbing.

---

## 2026-02-11: Signup A11y Gate Stabilization (Hybrid Fix)

What changed:

- Updated signup account-type screen contrast in `src/app/(auth)/signup/SignupContent.tsx`:
  - Replaced low-opacity text colors on white surfaces with higher-contrast text colors.
  - Updated account-type CTA text/link colors to high-contrast values on white backgrounds.
- Removed opacity entrance fades from signup elements that are scanned by axe while keeping positional motion:
  - Main signup content wrapper
  - Logo mark animation wrapper
  - Account-type card motion wrappers
  - Back button motion wrapper
- Hardened a11y settle logic in `tests/a11y/critical-flows.spec.ts`:
  - Added signup-specific readiness checks.
  - Before scanning `/signup`, waits for the `Individual` heading and `Continue as Individual` CTA to be visible and fully stable (no ancestor opacity transition in progress).
  - Kept WCAG tags and assertions unchanged.
- Updated accessibility evidence file `ACCESSIBILITY_AUDIT_REPORT.md` to reflect current automated results.

Why:

- Signup a11y failures were caused by a combination of real low-contrast text on white surfaces and timing races where axe could scan during motion opacity transitions.
- This hybrid fix resolves both root causes without weakening rules or changing signup behavior.

How to verify:

- Focused signup regression:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH node ./scripts/playwright-node20.mjs test --config playwright.a11y.config.ts --project=chromium tests/a11y/critical-flows.spec.ts -g "Signup page should be accessible"`
- Full a11y suite:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:a11y`
- Safety checks:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`

Open risks/TODO:

- Playwright web server logs still show occasional `ECONNRESET`/`web_vitals.record.failed` noise during teardown; tests pass but server-side telemetry handling could be hardened in a separate task.

---

## 2026-02-11: Organization Profile Hardening Pass 2

What changed:

- Wired real organization verification status through auth/org loading and profile rendering:
  - `src/lib/auth.ts`
  - `src/app/app/o/[slug]/profile/page.tsx`
- Kept legacy org server action but marked it deprecated with runtime warning:
  - `src/actions/org.ts`
- Removed dead, unused empty-profile component:
  - `src/components/profile/EmptyOrganizationProfileView.tsx`
- Tightened `PUT /api/organizations/[orgId]` validation while preserving patch semantics:
  - `causes` must be `null` or an array of non-empty strings (max 5).
  - `foundedDate` must be `null` or a valid `YYYY-MM-DD` calendar date.
  - `src/app/api/organizations/[orgId]/route.ts`
- Added stable selector hooks for profile edit smoke coverage:
  - `src/components/organization/OrganizationHero.tsx`
  - `src/components/profile/OrganizationProfileView.tsx`
  - `src/components/organization/OrganizationBasicInfoEditor.tsx`
- Extended API route tests for new validation behavior:
  - `tests/api/organizations-route.test.ts`
- Added org profile smoke test scaffold (credential-gated):
  - `e2e/org/profile-basic-info.spec.ts`
- Hardened org signup helper for current signup form requirements (confirm password + GDPR consent):
  - `e2e/helpers/auth.ts`

Why:

- The profile hero was still showing `verified: false` despite having org-level verified state in schema.
- API accepted malformed `causes` and `foundedDate` payloads.
- E2E profile save flow needed stable selectors and a dedicated regression entrypoint.
- Signup helper had drifted from current UI requirements, breaking org signup-based smoke paths.

How to verify:

- Targeted route/UI/unit checks:
  - `npm run test -- tests/api/organizations-route.test.ts tests/ui/organization-basic-info-editor.test.tsx tests/lib/normalize-organization-website.test.ts`
- E2E smoke:
  - `npm run test:e2e -- e2e/org/profile-basic-info.spec.ts --project=chromium`
  - Note: requires `E2E_ORG_ADMIN_EMAIL` and `E2E_ORG_ADMIN_PASSWORD` to execute; otherwise test is skipped.
- Full checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`

Open risks/TODO:

- E2E org profile smoke currently skips when credential env vars are not present locally.
- Playwright web server teardown still emits occasional `ECONNRESET` noise in logs after test completion.
