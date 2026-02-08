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

## 2026-02-07: Fix Vercel Next.js CVE Block (CVE-2025-66478)

What changed:

- Bumped `next` to `^15.5.12` and aligned `eslint-config-next` to `^15.5.12` to satisfy Vercel's vulnerable Next.js build gate.

Why:

- Vercel blocked builds with `Error: Vulnerable version of Next.js detected` and required upgrading to a patched release.

How to verify:

- Local checks (Node `20.20.0`):
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- Vercel parity build (optional, if linked and authenticated):
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npx vercel@latest pull --yes --environment=production`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npx vercel@latest build --prod`

Open risks/TODO:

- If Vercel project settings force Node 22+, confirm the project uses Node 20.x per `package.json` engines to avoid future drift.

## 2026-02-08: API Coverage and Runtime Health Verification (Local + Production)

What changed:

- Added a compatibility analytics ingestion endpoint: `src/app/api/analytics/events/route.ts`.
- Added SUS survey eligibility endpoint used by the client hook: `src/app/api/surveys/sus/eligibility/route.ts`.
- Fixed broken Opportunities page API wiring by switching to canonical matching endpoints: `src/app/app/i/opportunities/page.tsx` now uses `POST /api/match/profile` for listing and `POST /api/match/interest`, `POST /api/match/hide`, `POST /api/match/snooze` for actions.
- Fixed a missing skill-add endpoint reference by using the canonical skills API: `src/components/expertise/GapMap.tsx` now calls `POST /api/expertise/user-skills` instead of `/api/skills/add`.
- Corrected API docs drift by removing the non-existent interview calendar `.ics` endpoint from `API_DOCUMENTATION_FINAL.md` (calendar downloads are generated client-side).
- Converted legacy matching profile endpoints to compatibility wrappers so they do not crash against the current `matching_profiles` schema:
  - `src/app/api/matching/profile/route.ts`
  - `src/app/api/matching/profile/[id]/route.ts`

Why:

- Several UI surfaces referenced API routes that did not exist, making those pages or features non-functional.
- API documentation referenced a calendar `.ics` route that is not implemented as an API route.
- The legacy `/api/matching/profile*` routes referenced an old schema (`user_id`, `name`, `constraints`, `is_active`) and could 500 at runtime if ever invoked.

How to verify:

- Local (Node `20.20.0`):
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm test`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run dev -- --port 3000`
- `curl -i http://localhost:3000/api/health`
- `curl -i http://localhost:3000/api/csrf-token`
- `curl -i http://localhost:3000/api/user/me` (expect `401`)
- `curl -i http://localhost:3000/api/cron/decision-reminders` (expect `401` without `CRON_SECRET`)
- Matching profile legacy compatibility (logged-in session required):
- `GET /api/matching/profile` should return `200` with either an empty list or a single legacy-shaped profile.
- `POST /api/matching/profile` with `{ "name": "...", "weights": { ... }, "constraints": { ... } }` should return `200` and persist weights to `matching_profiles.weights`.
- `GET /api/matching/profile/<userId>` should return `200` for the authenticated user's id, `404` otherwise.
- `DELETE /api/matching/profile/<userId>` should return `405`.
- Production smoke:
- `curl -i https://proofound.io/api/health`
- `curl -i https://proofound.io/api/csrf-token`

Open risks/TODO:

- The new `/api/analytics/events` endpoint is intentionally auth-gated. If server-side (non-cookie) callers are introduced later, add an explicit server auth mechanism rather than weakening access control.
- Legacy matching profile constraints are accepted and echoed but are not enforced by the matching engine. If constraints are needed, implement them in the canonical matching profile and scorers, not via the legacy endpoints.

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

## 2026-02-07: Back Up Local Git Stashes to Remote Branches (No PRs)

What changed:

- Converted the remaining local-only git stashes into pushed backup branches on `origin` (no PRs).
- Dropped all local stash entries after verifying push + green preflight gate per stash branch.

Why:

- Prevent losing local-only work by ensuring it exists on the remote as backup branches.

How to verify:

- Branch existence:
  - `git ls-remote --heads origin codex/stash-refactor-quick-wins-0-2026-02-07`
  - `git ls-remote --heads origin codex/stash-refactor-quick-wins-1-2026-02-07`
  - `git ls-remote --heads origin codex/stash-master-2-2026-02-07`
  - `git ls-remote --heads origin codex/stash-fix-userid-matching-profile-3-2026-02-07`
  - `git ls-remote --heads origin codex/stash-zoom-next-bump-2026-02-07`
- Stashes cleared:
  - `git stash list` (should be empty)
- Preflight gate (example commands used):
  - `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"`
  - `npm ci && npm run lint && npm run typecheck && npm run test && npm run build`
  - `npx vercel@latest pull --yes --environment=production --scope pavlo-samoshkos-projects --token "$VERCEL_TOKEN"`
  - `npx vercel@latest build --prod --yes --scope pavlo-samoshkos-projects --token "$VERCEL_TOKEN"`

Open risks/TODO:

- These branches are backups, not reviewed PRs. Any salvage conflicts were resolved to pass preflight, but should be reviewed before merging anywhere.

---

## 2026-02-08: Fix Supabase Migration History Mismatch (Push Dry Run)

What changed:

- Synced `supabase/migrations/` to contain placeholder `.sql` files for every remote entry in `supabase_migrations.schema_migrations` so Supabase CLI can validate history.
- Moved the repo-only Supabase SQL migrations out of the active directory into `supabase/migrations_legacy/` to avoid re-applying them.
- Added a helper tool to re-sync when needed: `agent/tools/supabase-sync-migration-history.mjs`.
- Documented the workflow in `RUN_MIGRATIONS_GUIDE.md` and `APPLY_MIGRATIONS_MANUAL.md`.

Why:

- `supabase db push --dry-run` was failing with "Remote migration versions not found in local migrations directory."

How to verify:

- `node agent/tools/supabase-sync-migration-history.mjs --dry-run`
- `supabase db push --db-url \"postgresql://...:6543/postgres?sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true\" --dry-run`

Open risks/TODO:

- Placeholder migrations are enough to satisfy CLI history checks, but they are not a substitute for the original SQL if the project ever needs full replay-from-scratch migrations.

---

## 2026-02-08: Matching Engine Fixes (Profile Setup, Mutual Interest, Explainer)

What changed:

- Routed `/api/matching-profile` to the repo's Drizzle-backed implementation in `src/app/api/core/matching/matching-profile/route.ts`.
- Fixed mutual interest logic so introductions work regardless of who clicks "Interested" first, and so conversations are created with a real org member participant.
- Replaced the match explainer endpoint to be schema-aligned with `matches`, `assignments`, `matching_profiles`, and `skills`.
- Updated `/app/i/matching/preferences` to use the matching profile setup flow (instead of the unused multi-profile API).
- Made `next build` resilient when Sentry upload credentials are not configured (local build should not fail due to missing Sentry env vars).

Why:

- Matching profile setup was wired to an outdated `/api/matching-profile` implementation that did not match the actual `matching_profiles` schema used by the matching engine.
- Mutual interest only worked when org interest happened first; candidate-first flows could not become mutual and conversation creation could fail due to using `assignment.orgId` where a user profile id is required.
- The match explainer endpoint referenced old column names and score fields, causing "Why this match" to fail.

How to verify:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- Manual smoke:
  - Individual: visit `/app/i/matching`, complete setup, confirm matches load.
  - Org: visit `/app/o/<slug>/matching`, pick an assignment, confirm candidates load.
  - Mutual interest:
    - Candidate clicks Interested first, then org clicks Interested for the same candidate, confirm a conversation is created and the individual is routed to `/app/i/messages?conversation=<id>`.
    - Org clicks Interested first, then candidate clicks Interested, confirm the same.
  - Explainer: open "Why this match?" for a match card and confirm modal renders rank, skills, purpose, and constraints.

Open risks/TODO:

- `/api/matching/profile/*` (multi-profile preferences) is still present but is not used by the main matching flow; consider deprecating/removing it to reduce confusion.

---

## 2026-02-08: Matching Engine Org <-> Individual Flow Fixes

What changed:

- `src/app/api/matching-profile/route.ts`: route now re-exports the canonical handler backed by the Drizzle `matching_profiles` table.
- `src/app/api/core/matching/interest/route.ts`: enforce org member authorization for org -> candidate interest, verify reciprocal org membership for mutual interest, and ensure mutual interest creates a conversation between the candidate and a real org member.
- `src/app/api/match/explain/[matchId]/route.ts`: rewrite to use current DB schema (`matches.vector.subscores`, `assignments.mustHaveSkills`, `matching_profiles.values_tags/cause_tags`), fix authorization, and compute rank from stored matches.
- `src/app/api/match/visible-fields/[matchId]/route.ts`: rewrite to use `profile_field_visibility` schema (column-based privacy controls) and return a consent-ready redacted field list.

Why:

- The repo had multiple "matching profile" implementations, and `/api/matching-profile` was not aligned with the schema actually used by the matching engine.
- Mutual interest could be detected in only one ordering or create invalid conversations when using org IDs instead of user IDs.
- The match explainer endpoint referenced legacy columns and could 500 on real data.
- The consent preview endpoint queried `profile_field_visibility` using non-existent columns, so the UI could not reliably preview what would be shared.

How to verify:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- Manual flow:
- Individual: visit `/app/i/matching`, complete the setup wizard, confirm matches load, and "Why this match?" opens without API errors.
- Consent: click "Interested" on a match and confirm the consent dialog loads via `/api/match/visible-fields/<matchId>`.
- Org -> candidate: as an org member, visit `/app/o/<slug>/matching`, click "Interested" on a candidate, then have the candidate also express interest and confirm the response returns `conversationId` and a conversation exists in `/app/i/messages`.

Open risks/TODO:

- Consent redaction currently treats `profile_field_visibility.* = 'private'` as hidden and everything else as visible. Confirm product intent for `network_only` vs `match_only`.
- Consent preview intentionally omits email (not represented in `profile_field_visibility`). If email should ever be shared, add explicit privacy controls first.

---

## 2026-02-08: Custom Skill Names on Self Profile (`/app/i/profile`)

What changed:

- Added a shared helper to derive human-friendly skill display names, including parsing custom `skill_id` values of the form `custom-<cat>-<subcat>-<l3>-<slug>`. (source: src/lib/skills/display-name.ts)
- Updated profile data loading so `/app/i/profile` renders custom skills with readable names instead of raw `custom-...` identifiers. (source: src/actions/profile.ts)

Why:

- Custom skills do not have taxonomy name data, so the self profile was falling back to `skills.skill_id` and rendering internal identifiers.

How to verify:

- Local checks (Node `20.20.0`):
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm test`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- Manual smoke (requires seeded taxonomy and a logged-in individual):
- Add a taxonomy skill and a custom skill in `/app/i/expertise`, then confirm `/app/i/profile` shows readable names for both.

Open risks/TODO:

- E2E signup and full journey specs may still fail locally if the environment is not configured for email verification or seeded taxonomy data.

---

## 2026-02-08: Fix Account Deletion Flow (30-day Grace Period)

What changed:

- `DELETE /api/user/account` now schedules account deletion for `now + 30 days` (password + exact phrase confirmation), sends a DeletionScheduled email, and tracks analytics. (source: src/app/api/user/account/route.ts, src/lib/email.ts, src/lib/analytics.ts)
- `POST /api/user/account/cancel-deletion` now tracks analytics on cancellation. (source: src/app/api/user/account/cancel-deletion/route.ts, src/lib/analytics.ts)
- Privacy settings UI now uses a single deletion surface at `/app/i/settings/privacy#delete-account`, supports scheduling and cancelling, and signs the user out immediately after scheduling. (source: src/components/privacy/DeleteAccountSection.tsx, src/components/settings/PrivacyOverview.tsx)
- Cron jobs now use the Supabase service role admin client, dedupe 7-day reminders per scheduled date, and delete the Supabase Auth user record after anonymizing app data. (source: src/app/api/cron/account-deletion-workflow/route.ts, src/app/api/cron/send-deletion-reminders/route.ts, src/app/api/cron/process-deletions/route.ts, src/lib/supabase/admin.ts)

Why:

- The account deletion UX, API, cron jobs, and email links were out of sync: UI sent the wrong payload, the API performed immediate deletion, cron used a non-admin client for admin operations, and emails linked to a non-existent settings URL.

How to verify:

- Local checks (Node `20.20.0`):
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (run after build if `.next/types` is missing)
- Manual:
- Visit `/app/i/settings/privacy#delete-account`.
- Schedule deletion: enter password, type `DELETE MY ACCOUNT`, confirm you are redirected to `/` and signed out.
- Sign back in: confirm scheduled state and Cancel button appear.
- Cancel deletion: confirm state returns to active.

Open risks/TODO:

- If a user schedules deletion and then re-schedules later, reminder dedupe now keys on `properties.scheduledFor`, but older reminder events without that property (or with different formatting) may still affect behavior depending on the historical data shape.
