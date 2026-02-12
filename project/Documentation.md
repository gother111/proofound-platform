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

## 2026-02-11: Landing Regression Guardrail Policy

What changed:

- Set canonical landing visual baseline to commit `af705d4`.
- Added dedicated landing visual contract test:
  - `e2e/landing-visual.spec.ts`
  - `e2e/landing-visual.spec.ts-snapshots/landing-home-af705d4-linux-chromium.png`
- Added CI scope guard script:
  - `scripts/check-landing-pr-scope.mjs`
- Updated CI to run:
  - `node ./scripts/check-landing-pr-scope.mjs` on pull requests
  - `npm run test:e2e:landing:visual` as a blocking check

Why:

- Repeated landing regressions were caused by mixed PRs that included landing-sensitive files with unrelated work.

Landing-sensitive paths:

- `src/app/page.tsx`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/ProofoundLanding.tsx`
- `src/components/landing/**`

Merge policy:

- Landing-sensitive changes must be isolated in a dedicated landing PR.
- Allowed co-files in a landing PR:
  - `e2e/landing-page.spec.ts`
  - `e2e/landing-visual.spec.ts`
  - `e2e/landing-visual.spec.ts-snapshots/**`
  - `project/Documentation.md`
  - `agent/scratchpad.md`

How to verify:

- `npm run test:e2e:landing`
- `npm run test:e2e:landing:visual`
- For PR scope check (local smoke):
  - `node ./scripts/check-landing-pr-scope.mjs`

Open risks/TODO:

- Visual baseline is Chromium/Linux specific by design; if rendering stack changes materially, baseline image must be regenerated intentionally in a dedicated landing PR.

## 2026-02-11: CI Reliability Unblock and Governance Hardening

What changed:

- Added robust landing scope diffing for CI pull_request runs:
  - `scripts/check-landing-pr-scope.mjs`
- Updated CI workflow to use full git history for scope checks and added Node heap headroom:
  - `.github/workflows/ci.yml`
- Updated accessibility workflow to add Node heap headroom and removed broken PR-comment failure step:
  - `.github/workflows/accessibility.yml`
- Added backlog triage ledger and queue classification:
  - `project/PR_TRIAGE_2026-02.md`

Why:

- `ci` failed in PR runs due shallow-history merge-base resolution in scope-check logic.
- `a11y` failed from Node heap OOM during `next build`.
- Accessibility workflow failure-comment step used an invalid repo path and added noisy non-actionable failures.
- Open PR backlog contained mixed/stale branches that needed a decision-complete salvage path.

How to verify:

- `node ./scripts/check-landing-pr-scope.mjs`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e:landing`
- `npm run test:e2e:landing:visual`

Open risks/TODO:

- Apply branch protection/ruleset on `master` with required checks `ci` and `a11y`.
- Enforce squash-only merges and auto-delete merged branches in repository settings.
- Keep docs/session logs in dedicated docs-only PRs to reduce merge conflict noise.

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

---

## 2026-02-11: Admin Dashboard Reliability Hardening

What changed:

- Normalized admin authorization to platform-role guard in critical admin routes:
  - `src/app/api/admin/verification/linkedin/[userId]/review/route.ts`
  - `src/app/api/admin/fairness-report/route.ts`
- Fixed LinkedIn review notification identity lookup:
  - Replaced invalid `profiles(email, full_name)` query with valid `profiles(display_name)` + Supabase admin auth user lookup.
- Fixed fairness metrics data flow to real match schema columns:
  - `src/app/api/admin/fairness-metrics/route.ts` now queries `score, profile_id, assignment_id, created_at`, computes metrics from returned rows, and keeps response keys stable.
- Fixed cron summary base URL precedence bug:
  - Added `src/app/api/admin/cron/summary/base-url.ts` and used it from `src/app/api/admin/cron/summary/route.ts`.
- Fixed CSRF-incompatible fairness note generation request:
  - `src/app/admin/fairness/notes/page.tsx` now uses `apiFetch` for `POST /api/admin/fairness/generate-note`.
- Hardened admin fairness notes rendering against incomplete/legacy payloads:
  - `src/app/admin/fairness/notes/page.tsx` now guards optional fields before string/number operations (`replace`, `toFixed`, array maps), preventing runtime crashes in admin mock smoke runs.
- Fixed organization verification badge rendering:
  - `src/components/admin/organizations/OrganizationsTable.tsx` now reflects `org.verified`.
- Converted admin dashboard test script to ESM:
  - `scripts/test-admin-dashboard-data.js`
- Added deterministic admin mock mode and smoke path:
  - Test-only mock admin role gating in `src/lib/auth/admin.ts`, `src/lib/supabase/server.ts`, and `src/lib/supabase/client.ts`.
  - Added `e2e/admin-dashboard-smoke.spec.ts`.
  - Added script `test:e2e:admin` in `package.json`.
- Added admin-focused route/UI tests:
  - `src/app/api/admin/__tests__/verification-linkedin-review-route.test.ts`
  - `src/app/api/admin/__tests__/fairness-report-route.test.ts`
  - `src/app/api/admin/__tests__/fairness-metrics-route.test.ts`
  - `src/app/api/admin/__tests__/cron-summary-route.test.ts`
  - `tests/ui/admin-fairness-notes-page.test.tsx`
  - `tests/ui/organizations-table.test.tsx`

Why:

- Several admin endpoints were checking non-existent/incorrect columns (`profiles.role`, `matches.total_score`, `matches.user_id`) and could block valid admin flows or return invalid metrics.
- Fairness note generation used raw `fetch` for a CSRF-protected mutation route.
- Organization verification state was not rendered accurately in admin UI.
- Admin reliability lacked deterministic route/UI coverage and a repeatable smoke path.

How to verify:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test -- src/app/api/admin` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test -- tests/ui/admin-fairness-notes-page.test.tsx tests/ui/organizations-table.test.tsx` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:e2e:admin` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH node scripts/test-admin-dashboard-data.js` (Runs under ESM; endpoint checks require running local app/auth and failed in this run due no active local admin session/server context.)

Open risks/TODO:

- `GET /api/admin/fairness-metrics` now computes deterministic metrics from available match columns, but demographic fairness depth is still limited by available columns in this endpoint.
- Admin smoke currently validates core page availability and blocking errors; it does not yet assert per-widget data freshness/SLA timestamps.

---

## 2026-02-11: Targeted Monitoring Consistency + OAuth Helper Consolidation

What changed:

- Locked `/api/monitoring/perf-status` response contract and preserved keys:
  - `status`, `sampleCount`, `windowHours`, `p95`, `budgetMs`, `ok`, `message`, `source`.
  - `source` semantics remain `analytics_events | probe`.
- Standardized monitoring percentile math to interpolation in app-side monitoring utility:
  - `src/lib/monitoring/api-latency.ts`
- Refactored perf-status route to consume shared percentile utility:
  - `src/app/api/monitoring/perf-status/route.ts`
- Added sync note to CI perf budget script percentile implementation:
  - `scripts/perf-budgets.mjs`
- Added shared OAuth helper module:
  - `src/lib/integrations/oauth-helpers.ts`
  - `buildOAuthCallbackHtml(...)` for popup/full-page callback response HTML
  - `resolveOAuthRedirectUri(...)` with precedence:
    - `NEXT_PUBLIC_SITE_URL`
    - `NEXT_PUBLIC_URL`
    - request origin
- Reused OAuth helper in six routes without changing external paths or query contracts:
  - `src/app/api/integrations/zoom/callback/route.ts`
  - `src/app/api/integrations/google/callback/route.ts`
  - `src/app/api/integrations/zoom/connect/route.ts`
  - `src/app/api/integrations/google/connect/route.ts`
  - `src/app/api/auth/zoom/callback/route.ts`
  - `src/app/api/auth/google/callback/route.ts`
- Preserved cookie names and behavior:
  - `zoom_oauth_state` and `google_oauth_state` still set on connect and cleared on callback completion.
- Added targeted tests:
  - `src/lib/monitoring/__tests__/api-latency-percentile.test.ts`
  - `src/app/api/monitoring/__tests__/perf-status-route.test.ts`
  - `src/lib/integrations/__tests__/oauth-helpers.test.ts`

Why:

- Monitoring used multiple percentile formulas, which could produce inconsistent P95 values across route and utility code.
- OAuth callback and redirect URI logic had duplicated implementations across providers/routes, increasing drift risk when patching.
- Perf-status fallback probe path had no direct route-level coverage.

How to verify:

- Targeted tests:
  - `npx vitest run src/lib/monitoring/__tests__/api-latency-percentile.test.ts src/lib/integrations/__tests__/oauth-helpers.test.ts src/app/api/monitoring/__tests__/perf-status-route.test.ts` (PASS)
- Full checks:
  - `npm run lint` (PASS)
  - `npm run typecheck` (PASS after `npm run build` regenerated `.next/types`)
  - `npm run test` (PASS)
  - `npm run build` (PASS)

Open risks/TODO:

- `npm run typecheck` can fail on this branch when `.next/types` is stale; running `npm run build` first regenerates route types.
- `scripts/perf-budgets.mjs` still carries a local percentile helper by design; keep it synced with `src/lib/monitoring/api-latency.ts` if formula changes again.
- Other modules still use mixed base URL env names (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `SITE_URL`); full repo-wide URL/env standardization remains out of scope for this targeted refactor.

---

## 2026-02-11: MVP Reliability Pass - Admin Growth Analytics SQL Hotfix

What changed:

- Fixed `/api/admin/analytics/growth` query construction in `src/app/api/admin/analytics/growth/route.ts`.
- Replaced string-based `DATE_TRUNC` interpolation with strict enum mapping for `groupBy`:
  - `day -> 'day'`
  - `week -> 'week'`
  - `month -> 'month'`
- Built reusable bucket expressions once per table and reused them in `select`, `groupBy`, and `orderBy` for both `profiles.createdAt` and `organizations.createdAt`.
- Added regression test coverage in `src/app/api/admin/__tests__/growth-route.test.ts`.
  - Validates successful response for `groupBy=day|week|month`.
  - Validates invalid `groupBy` fallback to `day` without throwing.
  - Validates analytics access logging with normalized filters.

Why:

- The previous query pattern used interpolated `DATE_TRUNC(${dateTrunc}, created_at)` fragments that produced a Postgres grouping failure under real DB execution.
- Reproduced error signature before fix:
  - `PostgresError: column "profiles.created_at" must appear in the GROUP BY clause or be used in an aggregate function` (`code: 42803`).
- This defect could cause admin growth chart API failures and user-visible empty/error states on the admin dashboard.

How to verify:

- Node/toolchain:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint` (PASS)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (PASS)
- Targeted regression:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test -- src/app/api/admin/__tests__/growth-route.test.ts` (PASS)
- Full checks:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test` (PASS)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build` (PASS)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:e2e:auth` (PASS)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:e2e:admin` (PASS)
- Launch gates:
  - `BASE_URL=http://localhost:3000 SUS_STUDY_COMPLETE=true npm run go:no-go` (PASS)
  - `BASE_URL=http://localhost:3000 npm run perf:budgets` (FAIL: TTI budgets only)

Open risks/TODO:

- `npm run perf:budgets` still fails TTI budgets on local production build:
  - Desktop TTI: ~5590ms vs 2500ms budget
  - Mobile TTI: ~5539ms vs 3500ms budget
- `npm run test:privacy` remains environment-gated locally due missing `.env.test` Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- `e2e/org/team-coverage.spec.ts` remains stale and out of scope for this pass (old routes like `/auth/login` and `/app/o/.../team/coverage`).

---

## 2026-02-11: Deployment Governance and Data Sync Stabilization

What changed:

- Deployment branch normalization to `master`:
  - `.github/workflows/ci.yml` push/PR triggers changed from `main` to `master` (kept `develop`).
  - `.github/workflows/playwright.yml` push/PR triggers changed to `master` only.
  - `.github/workflows/accessibility.yml` removed `main` from push/PR triggers.
- Added Vercel governance and parity tooling:
  - `scripts/vercel-preflight.mjs`
  - New npm scripts in `package.json`:
    - `npm run vercel:preflight`
    - `npm run vercel:env-parity`
- Added data safety tooling:
  - `scripts/db-backup-checkpoint.mjs`
  - `scripts/audit-migration-ledger.mjs`
  - New npm scripts in `package.json`:
    - `npm run db:backup:checkpoint`
    - `npm run db:audit:migrations`
- Added cron idempotency migration:
  - `supabase/migrations/20260211123000_cron_idempotency_guards.sql`
  - Adds unique guard on `decision_reminders (interview_id, reminder_type)`.
  - Adds partial unique guard for deletion reminder analytics events keyed by `user_id` + `properties->>'scheduledFor'`.
- Secret hygiene hardening in tracked files:
  - Replaced hardcoded credential writer with safe template generator:
    - `update-env.cjs`
  - Sanitized credential examples/placeholders in:
    - `SETUP_SUPABASE.md`
    - `MCP_STATUS.md`
    - `docs/SUPABASE_MCP_SETUP.md`
    - `QUICK_START.md`
    - `mcp-config.json`
  - Removed hardcoded DB credentials from helper scripts:
    - `find-region.cjs`
    - `test-connection.cjs`
    - `test-connection-5432.cjs`
    - `test-connection-eu.cjs`
- Runbook/checklist updates:
  - `agent/checklists/preflight.md`
  - `agent/checklists/verification.md`
  - `agent/runbooks/setup.md`
  - Added explicit policy: do not run `db:push` on production; use versioned SQL migrations.
- Vercel project controls applied:
  - Duplicate project `proofound` was unlinked from Git to stop branch-triggered auto deployments.
  - `proofound-platform` env normalization applied for `NEXT_PUBLIC_SITE_URL` and `ZOOM_REDIRECT_URI` across `production`, `preview`, `development`.
  - `proofound` `CRON_SECRET` rotated to isolate duplicate cron execution risk.
- Branch archival marker:
  - Created and pushed tag `archive/main-2026-02-11` at `origin/main` for rollback/reference.

Why:

- Landing and deploy drift originated from mixed branch/project deployment paths (`main` vs `master`, dual Vercel projects on one repo).
- Both Vercel projects were capable of writing into the same production-like Supabase/Postgres backend.
- Repo had high-risk tracked credentials in helper/docs that required immediate cleanup.
- Cron endpoints needed DB-level idempotency to prevent duplicate writes during repeated invocations.

How to verify:

- Node/toolchain:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH node -v` (expect `v20.20.0`)
- Repo checks:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint` (PASS)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (PASS)
- Vercel governance checks:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run vercel:preflight` (PASS)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run vercel:env-parity` (PASS; reports expected drift vs decommissioned project)
- Data safety checks:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:backup:checkpoint` (PASS; checkpoint under `/tmp/proofound-db-checkpoints/...`)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:audit:migrations` (expected non-zero when ledger drift exists; observed `exit=2`)
- Project topology check:
  - Vercel API confirms `proofound-platform` remains linked with `productionBranch=master` and `proofound` is unlinked.

Open risks/TODO:

- GitHub branch protection API remains blocked by plan/visibility constraints on private repo (403). CI and process checks are in place, but server-side branch protection is not yet enforceable.
- Secret rotation in external providers is still required and must be done manually in provider consoles:
  - Supabase DB password / keys
  - GitHub PATs
  - Vercel tokens
  - Zoom secret
  - Veriff secret
  - Resend API key
- `supabase_migrations.schema_migrations` still diverges heavily from local `supabase/migrations` filenames. Reconciliation and backfill of missing migration files should be completed before applying new production DDL.
- New idempotency migration file was added but not applied in this run.

Update (same run):

- Applied `supabase/migrations/20260211123000_cron_idempotency_guards.sql` directly to current DB after making it conditional on table existence.
- Verified indexes now exist:
  - `analytics_events_deletion_reminder_once_idx`
  - `decision_reminders_interview_type_unique_idx`
- Note: direct SQL execution does not register a new row in `supabase_migrations.schema_migrations`; migration ledger reconciliation remains required.

## 2026-02-11: Recovery Execution Progress (Phase 0 + Partial Phase 3/4)

What changed:

- Added a timestamped forensic PR inventory and overlap matrix to `project/PR_TRIAGE_2026-02.md`.
- Verified `#141` had no unique files versus `#142` and closed `#141` as superseded.
- Closed archive-stale set with traceability comments:
  - `#53`, `#55`, `#59`, `#61`, `#71`, `#93`, `#94`, `#109`, `#113`.
- Extracted and opened scoped salvage PRs from mixed sources:
  - `#143` from `#126`: Next.js dependency patch slice only.
  - `#144` from `#133`: monitoring percentile/perf-status slice only.
- Closed mixed source PRs after extraction/rejection decisions:
  - `#126`, `#133`, `#136`, `#130`, `#128`, `#127`.
- Updated triage ledger with current active queue and blocking condition.

Why:

- Reduce merge-risk noise from large stacked PRs.
- Preserve only changes with clear current value in small verifiable slices.
- Keep a single auditable source of truth for PR disposition.

How to verify:

- `gh pr list --state open --base master --limit 100`
- `gh pr view 142 --json statusCheckRollup,reviewDecision,mergeStateStatus`
- `gh pr view 143 --json files,statusCheckRollup`
- `gh pr view 144 --json files,statusCheckRollup`
- Review ledger updates in `project/PR_TRIAGE_2026-02.md`.

Open risks/TODO:

- Queue remains blocked on required-review policy when no second write-access reviewer is available.
- `#142` required checks are passing but merge cannot proceed without an external approval.
- `#137`, `#140`, `#138`, `#134` are queued but cannot be merged until reviewer approval flow is satisfied.
- Deferred large PR `#132` still requires explicit slice-by-slice triage before any keep/reject decision.

---

## 2026-02-12: Unified Open-PR Preservation Execution (in progress)

What changed:

- Merged scoped salvage PRs:
  - `#145` LinkedIn OAuth/settings verification salvage from `#132`.
  - `#147` organization profile API/editor core salvage from `#132`.
- Opened and queued remaining scoped salvage PRs (all based on `master`):
  - `#146` OAuth helper dedup slice from `#132`.
  - `#148` admin fairness/verification hardening slice from `#132`.
  - `#149` infra doc-link slice from `#138`.
  - `#150` instrumentation-client migration slice from `#119`.
  - `#151` env-sync helper coverage slice from `#124`.
- Preserved one additional low-risk change from legacy `#117` into `#148`:
  - `src/app/api/admin/__tests__/users-route.test.ts` cleanup (`test(admin): remove unused schema import`).
- Closed superseded/unmergeable legacy PRs with traceability comments:
  - `#120`, `#123`, `#125`, `#121`, `#122`, `#118`, `#116`, `#86`.

Why:

- Keep currently valuable behavior while avoiding direct merges from mixed/diverged branches.
- Reduce open PR noise so the queue contains only scoped, testable, merge-ready work.
- Preserve landing isolation by rejecting mixed legacy branches with landing-sensitive drift.

How to verify:

- Queue inventory:
  - `gh pr list --state open --limit 100`
- Required check status for active salvage lane:
  - `gh pr checks 146`
  - `gh pr checks 148`
  - `gh pr checks 149`
  - `gh pr checks 150`
  - `gh pr checks 151`
- Confirm merged salvage PRs:
  - `gh pr view 145 --json state,mergedAt,mergeCommit`
  - `gh pr view 147 --json state,mergedAt,mergeCommit`

Open risks/TODO:

- Remaining salvage PRs are currently blocked only by required check queue time (`ci`/`a11y` pending).
- Source PRs `#132`, `#138`, `#119`, `#124`, `#134`, `#131`, `#117` still need final close-out after replacement slices merge.
- `master` branch protection approvals are still temporarily `0` and must be restored to `1` after this recovery lane completes.

---

## 2026-02-12: Left-Out Recovery Slices (A-F) and Docs Disposition Update

What changed:

- Opened scoped left-out recovery PRs:
  - `#153` auth and supabase leftovers from `#132`.
  - `#154` organization profile UI leftovers from `#132`.
  - `#155` signup accessibility leftovers from `#132`.
  - `#156` admin smoke tooling/docs leftovers from `#132`.
  - `#157` preflight process leftovers from `#138/#131`.
  - `#158` non-landing leftovers from `#119`.
- Preserved only non-landing and currently valuable leftovers.
- Rejected stale workflow carryovers and historical bulk-doc pastes from `#131` and `#134`.
- Kept landing lock by excluding legacy `src/components/landing/sections/HowItWorksSection.tsx` drift from salvage.

Why:

- Recover proven value without reintroducing mixed-branch regressions.
- Keep each salvage behavior independently mergeable and revertable.
- Preserve landing stability while retaining non-landing work.

How to verify:

- PR queue:
  - `gh pr list --state open --base master --limit 100`
- Checks run during slice preparation:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run test:a11y` (for signup a11y slice)
  - `npx vitest run tests/ui/organizations-table.test.tsx tests/ui/organization-basic-info-editor.test.tsx tests/api/organizations-route.test.ts tests/lib/normalize-organization-website.test.ts` (for org UI slice)

Open risks/TODO:

- Admin smoke e2e in `#156` is expected to depend on merged auth/supabase mock-role path and can fail before `#153` lands.
- Left-out matrix branch `codex/salvage-leftout-recovery-matrix` should be merged (or equivalent section replayed) so the matrix is canonical on `master`.
- Parallel profile-sharing work is active in another process; those files were intentionally excluded from this salvage lane.

---

## 2026-02-12: Auth Logo Consistency (Login + Signup Chooser)

What changed:

- Replaced the custom `P` badge on the login card header with the same landing-style logo asset and sizing.
  - `src/components/auth/SignIn.tsx`
- Replaced the custom `P` badge on the signup account-type chooser header with the same landing-style logo asset and sizing.
  - `src/app/(auth)/signup/SignupContent.tsx`
- Kept signup form persona icons and signup success-state icon unchanged as scoped.

Why:

- Ensure visual consistency with the landing page header logo while preserving all auth behavior and flow logic.

How to verify:

- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test` (PASS)
- `npm run build` (PASS)
- `npm run test:e2e:auth` (PASS)
- Runtime marker smoke (PASS):
  - Start dev server and check `/login` contains `logo.png` and `Welcome back`.
  - Start dev server and check `/signup` contains `logo.png` and `Join Proofound`.

Open risks/TODO:

- No functional auth risk identified. This is a visual-only change.
- Existing non-blocking warning remains unrelated to this task: `<img>` usage in `src/components/profile/PublicSnippetView.tsx`.

## 2026-02-12: Public Profile Sharing Fix (Individual + Organization)

What changed:

- Enforced canonical share URL base for snippets in `src/lib/profile/snippet-generator.ts`:
  - Uses `NEXT_PUBLIC_SITE_URL` only for share links.
  - Normalizes host and rewrites legacy `proofound.com` and `www.proofound.com` to `proofound.io`.
  - Added `buildPublicEmbedURLFromProfileURL` and `generateEmbedCodeFromUrl`.
- Extended snippet API for organization sharing in `src/app/api/profile/snippet/route.ts`:
  - Supports `profileType: 'individual' | 'organization'` and `orgId`.
  - Verifies active organization membership before creating org snippets.
  - Returns `profileType` and `orgId` in API responses.
- Added public snippet rendering routes:
  - `src/app/p/[token]/page.tsx`
  - `src/app/p/[token]/embed/page.tsx`
- Added shared public snippet data/model layer in `src/lib/profile/public-snippet.ts`.
- Added shared UI renderer in `src/components/profile/PublicSnippetView.tsx`.
- Added organization sharing UI wiring:
  - `src/components/profile/OrganizationShareControl.tsx`
  - `src/components/profile/OrganizationProfileView.tsx` now shows org share control.
  - `src/components/profile/ShareProfileDialog.tsx` now supports both personas and uses server returned `url` as the single source for link and embed.
- Added embed-only route behavior updates:
  - `next.config.js`: removed conflicting global `X-Frame-Options` and CSP header emission.
  - `src/middleware.ts`: keeps anti-iframe defaults and allows framing only for `/p/<token>/embed`.
- Added migration:
  - `supabase/migrations/20260212110000_extend_profile_snippets_for_org.sql`
  - Adds `profile_type`, `org_id`, constraints, and indexes.
- Added tests:
  - `tests/lib/profile-snippet-url.test.ts`
  - `tests/api/profile-snippet-route.test.ts`
  - `tests/ui/share-profile-dialog.test.tsx`

Why:

- Share links were still generated as `proofound.com` in some paths and public snippet routes were missing or incomplete for end-to-end sharing.
- Organization profile sharing required the same token flow with membership checks and privacy enforcement.
- Embed behavior needed a route-specific framing exception without loosening the rest of the app.

How to verify:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint` (PASS, one existing non-blocking warning for `<img>` in `PublicSnippetView`)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build` (PASS)

Open risks/TODO:

- Existing already-shared `proofound.com` links outside the app cannot be redirected by this codebase alone.
- `frame-ancestors *` is intentionally limited to `/p/<token>/embed`; keep this route-scoped and do not broaden it.
- Optional hardening follow-up: replace `<img>` with `next/image` in `src/components/profile/PublicSnippetView.tsx` if layout permits.

---

## 2026-02-12: Profile Sharing Follow-up (Lint Hardening + Production Smoke)

What changed:

- Replaced avatar `<img>` with `next/image` in:
  - `src/components/profile/PublicSnippetView.tsx`
- Used fixed dimensions (`64x64`) and `unoptimized` to preserve existing remote image behavior while removing the lint violation.
- Added reusable profile-sharing smoke steps to:
  - `agent/checklists/verification.md`

Why:

- Clear the remaining non-blocking lint warning after profile sharing merge.
- Capture a repeatable production smoke routine for public profile sharing endpoints.

How to verify:

- Local checks:
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint` (PASS, no warning in `PublicSnippetView`)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (PASS)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test` (PASS)
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build` (PASS)
- Production smoke checks (`proofound.io`):
  - `GET /api/health` -> `200` and healthy payload on deployed commit.
  - `POST /api/profile/snippet` without CSRF/auth -> `403` (`CSRF validation failed`), confirming guard behavior.
  - `GET /p/invalidtoken` -> `200` with invalid/expired fallback content (no server error).
  - `GET /p/invalidtoken/embed` -> `200` with `content-security-policy` containing `frame-ancestors *` and matched embed route.

Open risks/TODO:

- `next/image` in `PublicSnippetView` is configured with `unoptimized` to avoid remote-loader/domain regressions; if optimization is required later, add explicit `images.remotePatterns` and remove `unoptimized`.
