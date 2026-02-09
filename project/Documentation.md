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
- `docs/architecture/overview.md`
- `project/Prompt.md`
- `project/Architecture.md`
- `docs/architecture/key-flows.md`
- `docs/architecture/data-model.md`
- `project/Plans.md`
- `project/Implement.md`
- `agent/runbooks/setup.md`
- `agent/runbooks/architecture-diagrams.md`

## 2026-02-08: System Design Docs and Diagrams (Onboarding + Evaluation)

What changed:

- Added newcomer-focused architecture docs with Mermaid diagrams: `docs/architecture/overview.md`, `docs/architecture/key-flows.md`, `docs/architecture/data-model.md`.
- Added a maintenance runbook for diagrams and infographics: `agent/runbooks/architecture-diagrams.md`.
- Added supplementary infographics (generated via `nano-banana-pro`): `docs/architecture/assets/system-overview.png`, `docs/architecture/assets/key-flows.png`, `docs/architecture/assets/data-model.png`, `docs/architecture/assets/architecture-diagram.png`, `docs/architecture/assets/stack.png`.
- Linked the new "start here" doc from `README.md`.

Why:

- The repo has many docs, but newcomers benefit from one repo-truth, diagram-forward entrypoint that explains stack boundaries and the highest-signal flows.

How to verify:

- Open and render: `docs/architecture/overview.md`, `docs/architecture/key-flows.md`, `docs/architecture/data-model.md`.
- Confirm images exist: `docs/architecture/assets/system-overview.png`, `docs/architecture/assets/key-flows.png`, `docs/architecture/assets/data-model.png`, `docs/architecture/assets/architecture-diagram.png`, `docs/architecture/assets/stack.png`.
- Run: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

Open risks/TODO:

- Keep Mermaid diagrams up to date when changing entrypoints, auth, or privacy semantics.

## 2026-02-08: Remove Embedded Secrets From Supabase Setup Docs and MCP Config

What changed:

- Sanitized Supabase and DB connection examples to use placeholders instead of real values: `SETUP_SUPABASE.md`, `docs/SUPABASE_MCP_SETUP.md`, `MCP_STATUS.md`.
- Removed the hardcoded Postgres connection string from `mcp-config.json` and replaced it with a wrapper that loads `DATABASE_URL` from `.env.local` or `.env.test`: `scripts/mcp-postgres.mjs`.
- Added a read-only DB connectivity and schema verifier: `scripts/db-verify.mjs` and `package.json` script `db:verify`.
- Updated DB helper scripts to be pooler-friendly and to avoid secrets in repo-tracked files: `scripts/verify-db-state.mjs`, `find-region.cjs`, `test-connection.cjs`, `test-connection-eu.cjs`, `test-connection-5432.cjs`, `update-env.cjs`.

Why:

- The repo policy is "no secrets in the repo". Setup docs and config must be safe to share and safe to commit.

How to verify:

- Confirm there are no repo-tracked Postgres URLs embedded in `mcp-config.json`: `rg -n \"postgresql://\" mcp-config.json` (expect no matches).
- With a valid `.env.local`: `npm run db:verify`.

Open risks/TODO:

- `db:verify` is a best-effort safety net and may need updates when schema and migrations evolve.

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

## 2026-02-08: Messaging, Identity Reveal Emails, and Persona-Agnostic Notification Links

What changed:

- Individual and org messages pages now render the staged messaging UI (`ConversationView`) backed by `GET/POST /api/conversations/[conversationId]/messages` (instead of `/api/messages` + realtime thread).
- Conversation list masking is now driven by the conversations API. Stage 1 shows the stored masked handle and the UI no longer overrides it to a hardcoded label.
- Staged messages API now marks unread messages as read on `GET`, updates `conversations.lastMessageAt` on `POST`, and creates `message_received` notifications.
- Notifications now use persona-agnostic action URLs: `message_received` uses `/app/messages?conversation=<id>` and `intro_accepted` uses `/app/messages`.
- New redirect entrypoints were added so email links and notification links work for both personas: `/app/messages`, `/app/notifications`, `/app/settings/notifications`.
- Org notifications pages were added under `/app/o/[slug]/notifications` and `/app/o/[slug]/settings/notifications`.
- Identity reveal emails now link to `/app/messages?conversation=<id>` and use `/portfolio/[handle]` for "View Their Profile" when a handle exists. Admin email lookup no longer uses `listUsers()` (uses `auth.admin.getUserById`).

Why:

- Make Stage 1 masking, PII warnings, and identity reveal behave consistently end to end by using the staged messaging system everywhere.
- Prevent persona-specific routes from breaking email and notification deep links for org members.

How to verify:

Node `20.20.0`:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:e2e -- e2e/workflows.spec.ts -g Messaging`

Open risks/TODO:

- Multi-org org members: `/app/messages` falls back to the first org membership if it cannot derive a slug from the conversation assignment.
- Realtime updates: the messages pages now rely on the staged API via `ConversationView`; reintroducing realtime should happen on top of the staged endpoints.

---

## 2026-02-08: Roll Back Remote Backup Branches

What changed:

- Deleted these remote branches from `origin` (GitHub):
  - `codex/api-coverage-health-messy`
  - `codex/api-coverage-health-single`
  - `codex/stash-zoom-next-bump-2026-02-07-legacy`
  - `codex/stash-refactor-quick-wins-0-2026-02-07-legacy`
  - `codex/stash-master-2-2026-02-07-legacy`

Why:

- User requested rollback: these branches were pushed as backups and should not remain on GitHub.

How to verify:

- Remote heads are gone:
  - `git ls-remote --heads origin codex/api-coverage-health-messy codex/api-coverage-health-single codex/stash-zoom-next-bump-2026-02-07-legacy codex/stash-refactor-quick-wins-0-2026-02-07-legacy codex/stash-master-2-2026-02-07-legacy`

Open risks/TODO:

- Deleting remote backup branches does not delete the commits from this local clone. If those commits are still needed, keep local branches or re-push later under a clearer naming scheme.

---

## 2026-02-08: Delete Local Backup Branch Pointers

What changed:

- Deleted these local branches:
  - `codex/api-coverage-health-messy`
  - `codex/api-coverage-health-single`
  - `codex/stash-zoom-next-bump-2026-02-07-legacy`
  - `codex/stash-refactor-quick-wins-0-2026-02-07-legacy`
  - `codex/stash-master-2-2026-02-07-legacy`

Why:

- User requested cleanup: remove local backup branches that could confuse day-to-day work.

How to verify:

- Local branches are gone:
  - `git branch --list codex/api-coverage-health-messy codex/api-coverage-health-single codex/stash-zoom-next-bump-2026-02-07-legacy codex/stash-refactor-quick-wins-0-2026-02-07-legacy codex/stash-master-2-2026-02-07-legacy`

Open risks/TODO:

- This removes only the branch pointers. The commit objects may still exist locally as dangling objects until git garbage collection runs. If those commits are needed again, recovery may be difficult after GC.

---

## 2026-02-08: Delete Vercel Deployments Created From Rolled Back Branches

What changed:

- Deleted the Vercel deployments whose git metadata referenced the rolled back branches:
  - `codex/api-coverage-health-messy`
  - `codex/api-coverage-health-single`
  - `codex/stash-zoom-next-bump-2026-02-07-legacy`
  - `codex/stash-refactor-quick-wins-0-2026-02-07-legacy`
  - `codex/stash-master-2-2026-02-07-legacy`

Why:

- Branch deletion on GitHub does not remove existing Vercel preview deployments. User requested cleanup to avoid confusion.

How to verify:

- Fetch deployments for the linked project and confirm none reference the deleted branch names:
  - `npx vercel@latest api "/v6/deployments?projectId=<projectId>&limit=200" --token "$VERCEL_TOKEN"`
  - Inspect `deployments[].meta.githubCommitRef` and confirm it does not match any of the branches above.

Open risks/TODO:

- Vercel deployment deletion is destructive. If you need a historical preview again, you will need to redeploy from an existing commit/branch.

---

## 2026-02-08: Metrics and Analytics Reliability (Web Vitals, Performance Track, CSRF)

What changed:

- Web vitals ingestion now writes to `web_vitals_metrics` (canonical per `supabase/migrations/20251108_add_web_vitals_metrics.sql`), including for anonymous sessions (`user_id = null`). (source: `src/app/api/analytics/web-vitals/route.ts`)
- Web vitals admin read endpoint is now truly admin-only via `requirePlatformAdminJson` (prevents non-admin access to aggregated vitals when DB access bypasses RLS). (source: `src/app/api/analytics/web-vitals/route.ts`, `src/lib/api/route-helpers.ts`)
- Performance tracking endpoint now accepts `inp` and `ttfb` so Web Vitals v5 client emissions are not dropped. (source: `src/app/api/performance/track/route.ts`, `src/lib/performance/client-tracker.ts`)
- CSRF session detection is now Supabase-project-agnostic by matching `sb-<projectRef>-auth-token(.N)?` cookies instead of hardcoding one project ref. (source: `src/lib/csrf.ts`)
- CSRF allowlist now includes `/api/performance/track` so beacon-style posts are not blocked. (source: `src/middleware.ts`)
- Admin performance dashboard mapping includes `INP` so it renders when stored. (source: `src/components/admin/PerformanceDashboard.tsx`)

Why:

- Fix empty performance dashboards and dropped metrics caused by table mismatch, missing INP support, and CSRF regressions when the Supabase project ref changes.
- Tighten access control: aggregated vitals are sensitive operational data and should only be visible to platform admins.

How to verify:

- Repo checks (Node 20.20.0):
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
- Manual smoke:
  - Run `npm run dev`.
  - Navigate a few pages and confirm:
    - `POST /api/analytics/web-vitals` returns `200`.
    - `POST /api/performance/track` returns `200` (no `CSRF validation failed`).
  - Open the admin Performance dashboard and confirm INP renders after a few navigations.

Open risks/TODO:

- `/api/performance/track` is CSRF-bypassed (required for beacons); keep origin checks and rate limiting coverage reviewed as the app grows.

---

## 2026-02-08: Make Vercel Preview Deployments Public (Disable Deployment Protection)

What changed:

- Updated the Vercel project `proofound-platform` Deployment Protection so Preview (`*.vercel.app`) URLs no longer require Vercel authentication.
  - Specifically, `ssoProtection` was set from `{ "deploymentType": "all_except_custom_domains" }` to `null` via the Vercel REST API.

Why:

- The preview URL previously returned HTTP 401 and displayed Vercel's "Authentication Required" page. That UI mismatch looked like a landing page regression even when the app output matched production.

How to verify:

- Preview URL returns the app HTML (not a Vercel auth page):
  - `curl -sSIL https://proofound-platform-irfnqi5zn-pavlo-samoshkos-projects.vercel.app/ | sed -n '1,15p'` (expect `HTTP/2 200` and `x-powered-by: Next.js`)
- Spot check a non-root route is also public:
  - `curl -sSIL https://proofound-platform-irfnqi5zn-pavlo-samoshkos-projects.vercel.app/login | sed -n '1,15p'` (expect `HTTP/2 200`)

Open risks/TODO:

- Preview deployments are now public to anyone with the URL. If previews need to be protected again, restore `ssoProtection` in the Vercel project settings (Dashboard) or via API.

---

## 2026-02-09: Antigravity Tools Proxy Validation (Gemini 3 Pro)

What changed:

- No repo changes. This entry records verification that Antigravity Tools (OpenAI-compatible local proxy on `127.0.0.1:8045`) is working and can serve `gemini-3-pro`.

Why:

- Establish a known-good baseline for routing OpenAI-SDK-shaped calls through the local Antigravity proxy for Gemini and Claude models.

How to verify:

- Proxy health:
  - `curl -sS http://127.0.0.1:8045/healthz`
- List models:
  - `curl -sS http://127.0.0.1:8045/v1/models`
  - `python3 ~/.codex/skills/antigravity-tools/scripts/ag_proxy.py models`
- Chat completion (example):
  - `python3 ~/.codex/skills/antigravity-tools/scripts/ag_proxy.py chat --model gemini-3-pro --message "Reply with exactly: ok"`

Open risks/TODO:

- If Antigravity proxy auth is enabled, callers must set `ANTIGRAVITY_API_KEY` or requests may return `401` or `403`.

---

## 2026-02-09: Landing Page Modern Polish (Preview Alignment)

What changed:

- Modernized the landing page UI implementation and behavior:
  - Reduced hardcoded colors in landing sections by switching to semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`), while keeping the Japandi direction.
  - Replaced `transition-all` usage in landing components with explicit transitions (`transition-colors`, `transition-transform`, `transition-shadow`, `transition-opacity`).
  - Added `scroll-mt-24` to anchor-target sections so hash navigation does not land under the fixed header.
  - Improved reduced-motion handling:
    - Lenis smooth scrolling is disabled when `prefers-reduced-motion` is enabled.
    - Animated sections render with zero-duration transitions or static variants; long-running background animations are disabled in reduced motion.
  - Made CTAs consistent and SPA friendly:
    - Primary CTA routes to `/signup?type=individual`.
    - Organization CTA routes to `/signup?type=organization`.
    - Updated signup page to honor `type` query param by preselecting the account type.
  - Replaced the custom menu overlay with a Radix Dialog based overlay (focus trapped, Escape closes), and ensured navigation items are real links.
- Homepage SEO basics:
  - Added homepage `metadata` in `src/app/page.tsx` including title, description, canonical, OpenGraph, and Twitter card fields.
  - Updated root metadata template in `src/app/layout.tsx` to avoid overriding page metadata.
  - Added `src/app/sitemap.ts` so `/sitemap.xml` exists and returns XML (used by `robots.txt`).
- A11y improvements:
  - Fixed contrast regressions discovered by `npm run test:a11y` (homepage and signup selection screen).
  - Removed footer logo `priority` to avoid unnecessary above-fold image prioritization.

Why:

- Ensure the landing page is modern, consistent across light and dark themes, respects reduced motion, and has accessible navigation.
- Ensure the landing CTAs match actual destinations and the signup flow respects the intended persona selection.
- Ensure basic homepage metadata and sitemap are present for validation and SEO fundamentals.

How to verify:

- Local checks (Node 20):
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run build`
  - `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test:a11y`
- Manual landing checklist:
  - Open the menu with keyboard, Tab cycles within, Escape closes, focus returns to the trigger.
  - With reduced motion enabled, there is no smooth scrolling and no infinite background animations.
  - Anchor links land below the fixed header.
  - CTAs route to `/signup?type=individual` and `/signup?type=organization`.
  - `/sitemap.xml` returns XML (not a 404 HTML page).

Open risks/TODO:

- Vercel Preview deployment URLs are immutable per build; redeploying will likely produce a new preview URL even if the project is the same.
