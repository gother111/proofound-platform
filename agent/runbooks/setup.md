> Doc Class: `governance`
> Sync Pair: `setup.md`
> Last Verified: `2026-02-26`

# Setup Runbook (Local Dev + CI Parity)

This runbook captures the repo’s actual scripts and gates. Do not paste secrets into tracked files.

## Prerequisites (Repo Truth)

- Node version is pinned in `.nvmrc` and constrained by `package.json` engines. (source: .nvmrc, package.json)
- The repo uses `npm` with `package-lock.json`. (source: package-lock.json)

### Node Version (Practical)

Use `nvm` to ensure you run the same Node version Vercel will use for this repo:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
node -v  # expect v24.15.0
```

## Environment Variables (Repo Truth)

- Start from `.env.example` and the reference guide in `docs/ENV_VARIABLES.md`. (source: .env.example, docs/ENV_VARIABLES.md)
- Do not commit secret env files; `.gitignore` excludes `.env` and `*.local` patterns. (source: .gitignore)
- Use `node update-env.cjs` only to generate a placeholder `.env.local` template. It intentionally does not include real credentials.
- Strict E2E suites load `.env.local` by default; set `STRICT_ENV_FILE` to override the env file path when needed.

## Auth Email Transport (Supabase SMTP)

- Signup verification and password reset emails are sent by Supabase Auth by default.
- Proofound code must keep auth email triggers on Supabase methods:
  - `supabase.auth.signUp(...)`
  - `supabase.auth.resend({ type: 'signup', ... })`
  - `supabase.auth.resetPasswordForEmail(...)`
- SMTP transport is configured in Supabase dashboard, not in repo code.
- Resilience fallback in `src/actions/auth.ts`:
  - If Supabase returns `Error sending confirmation email` or `Error sending recovery email`, server actions generate Supabase auth links via `admin.generateLink(...)` and send them via `src/lib/email/sender` (Resend API).
  - Fallback still uses Supabase verify endpoints in the link and does not auto-confirm users.
- Current expected SMTP settings:
  - Host: `smtp.resend.com`
  - Port: `465`
  - Username: `resend`
  - Sender: `no-reply@proofound.io`
- `RESEND_API_KEY` in app env is for non-auth transactional emails (invitations, notifications, reports), not Supabase Auth SMTP.

## Vercel Production Prebuilt Deployment

Use this when production should be deployed from CI-built output instead of a normal Vercel cloud build.

- Workflow:
  - `.github/workflows/retry-vercel-deploy.yml`
- Behavior:
  - Runs on push to `master` and manual dispatch.
  - Reads the live production SHA from Vercel deployment metadata.
  - If production is behind and no matching prebuilt deployment is already running, it:
    - runs `vercel pull --yes --environment=production`
    - runs `vercel build --prod`
    - runs `vercel deploy --prebuilt --prod`
  - Writes the deployed URL to the GitHub Actions summary.
- Required GitHub secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- Important caveat:
  - If Vercel Git auto-deploys are still enabled for production, Vercel can still trigger cloud-build deployments for `master` until those settings are intentionally disabled.
- Local parity path:
  - `npm run vercel:preflight`
  - `npm run vercel:pull:production`
  - `npm run vercel:build:production`
  - `ls .vercel/output`
  - `npm run vercel:deploy:prebuilt:production`
- Operational check:
  - `gh workflow run "Retry Vercel Deploy Until Synced" --ref master`
  - `gh run list --workflow "Retry Vercel Deploy Until Synced" --limit 1`

## Video Providers (Zoom, Google Meet)

The app stores video provider tokens in `user_video_integrations` (Supabase) and uses these routes for OAuth:

- Connect:
  - `GET /api/integrations/zoom/connect`
  - `GET /api/integrations/google/connect`
- Callback:
  - `GET /api/integrations/zoom/callback`
  - `GET /api/integrations/google/callback`

Required env vars:

- Zoom: `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_REDIRECT_URI`
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- LinkedIn: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, optional `LINKEDIN_REDIRECT_URI`

Supabase social auth callback requirements (same Google and LinkedIn client IDs):

- Google Supabase callback: `https://<supabase-project>.supabase.co/auth/v1/callback`
- LinkedIn Supabase callback: `https://<supabase-project>.supabase.co/auth/v1/callback`

Notes:

- `GOOGLE_REDIRECT_URI` must match the redirect URI configured in the provider console.
- `GOOGLE_CLIENT_ID` must be the raw OAuth client id (for example `...apps.googleusercontent.com`) and must not include `http://` or `https://`.
- For app-managed Google Meet integration, prefer `GOOGLE_REDIRECT_URI=/api/integrations/google/callback`.
- Add fully-qualified Google callback URLs for each app host in provider dashboards (production, localhost, and stable preview domains).
- For LinkedIn settings integration, callback must include `https://<site-domain>/api/auth/linkedin/callback`.
- LinkedIn callback URI behavior:
  - Absolute `LINKEDIN_REDIRECT_URI`: used as-is.
  - Relative `LINKEDIN_REDIRECT_URI`: resolved against current request origin.
  - Unset `LINKEDIN_REDIRECT_URI`: defaults to `<current-origin>/api/auth/linkedin/callback` (recommended for prod + demo domain support).
- Callbacks validate an httpOnly state cookie set during connect (`zoom_oauth_state`, `google_oauth_state`). If the cookie is missing (for example, using a different domain, or blocked cookies), the callback will fail.

Google `403 access_denied` ("app not verified") quick response:

1. Check Google OAuth consent screen status (`Testing` vs `In production`) in Google Cloud Console.
2. If in `Testing`, add the affected account under OAuth **Test users** and retry.
3. If in `In production`, confirm whether configured Calendar scopes require verification and complete Google app verification requirements.
4. Re-test from `/app/i/settings?tab=integrations` with **Connect Google Calendar**.
5. If still failing, capture callback query details (`error`, `error_description`, `error_subtype`) for logs and triage.

Strict provider E2E deterministic account:

- `E2E_PROVIDER_USER_ID`, `E2E_PROVIDER_USER_EMAIL`, `E2E_PROVIDER_USER_PASSWORD`
- `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true`
- Connected-provider runs should use only provider flows intentionally in scope for the target.
- The locked MVP interview posture remains manual-link first; native Zoom/video integration must not be reintroduced as a launch gate.

## Install Dependencies

- CI installs dependencies via `npm ci`. (source: .github/workflows/ci.yml)
- Guidance: Local installs typically use `npm install` (standard npm workflow). **Note:** not required for docs-only changes.

## Core Commands (Repo Truth)

- Dev server: `npm run dev` (source: package.json)
- Build: `npm run build` (source: package.json)
  - The prebuild cleanup removes stale generated `.next`, `.next-dev-*`, and `tsconfig.tsbuildinfo` state by default to avoid multi-GB artifact buildup.
  - It keeps only a small latest-run summary at `.artifacts/stale-build-state-cleanup-summary.md`.
  - Use `PROOFOUND_ARCHIVE_STALE_BUILD_STATE=1 npm run build` only when preserving a generated build snapshot is intentionally needed for debugging.
- Start (prod-like): `npm run start` (source: package.json)
- Lint: `npm run lint` (wrapper is `scripts/lint-or-skip.js`) (source: package.json, scripts/lint-or-skip.js)
- Typecheck: `npm run typecheck` (source: package.json)
- Unit tests: `npm run test` (Vitest config in `vitest.config.ts`) (source: package.json, vitest.config.ts)

## DB / Migrations (Repo Truth)

- Drizzle config and schema:
  - `drizzle.config.ts` (source: drizzle.config.ts)
  - `src/db/schema.ts` (source: src/db/schema.ts)
- Drizzle commands:
  - `npm run db:generate`, `npm run db:push`, `npm run db:migrate`, `npm run db:studio` (source: package.json)
- SQL runner:
  - `npm run db:migrate` runs `node run-migrations.mjs` which applies ordered `src/db/migrations/*.sql` plus ledgered `src/db/policies.sql` and `src/db/triggers.sql`. (source: package.json, run-migrations.mjs, src/db/migrations/, src/db/policies.sql, src/db/triggers.sql)
  - `npm run db:drift-check` validates migration-path discipline in CI. (source: package.json, scripts/check-migration-drift.mjs)
- Manual migration docs:
  - `RUN_MIGRATIONS_GUIDE.md`, `APPLY_MIGRATIONS_MANUAL.md` (source: RUN_MIGRATIONS_GUIDE.md, APPLY_MIGRATIONS_MANUAL.md)
- Safety scripts:
  - `npm run db:backup:checkpoint` creates schema and critical-table checkpoints before production DDL.
  - `npm run db:restore:verify -- --checkpoint <dir>` validates a restored database against a saved checkpoint fingerprint.
  - `npm run db:audit:migrations` audits canonical ledger parity for `src/db/migrations/` plus supplemental policy/trigger versions against `public.app_migration_ledger`.
  - Strict legacy baseline audit: `npm run db:audit:migrations -- --mode legacy-supabase-baseline --baseline supabase/ledger-baseline/schema_migrations.current-db.json`.
  - Diagnostics-only legacy file inventory audit: `npm run db:audit:migrations -- --mode legacy-supabase`.
  - Migration path discipline is enforced via `npm run db:drift-check` and migration apply via `npm run db:migrate`.
- Policy: do not run `npm run db:push` against production. Use explicit SQL migration files.

## E2E / Accessibility (Repo Truth)

- E2E: `npm run test:e2e` (Playwright config in `playwright.config.ts`) (source: package.json, playwright.config.ts)
- A11y: `npm run test:a11y` (source: package.json)
  - `playwright.a11y.config.ts` and `playwright.a11y.strict.config.ts` are both present in repo. (source: playwright.a11y.config.ts, playwright.a11y.strict.config.ts)

## CI Gates Beyond Tests (Repo Truth)

- CI runs perf budgets and go/no-go after starting the app. (source: .github/workflows/ci.yml)
- CI now runs launch smoke before the strict browser gates and go/no-go. (source: .github/workflows/ci.yml)
- Perf budgets: `npm run perf:budgets` implemented in `scripts/perf-budgets.mjs`. (source: package.json, scripts/perf-budgets.mjs)
- Launch smoke: `npm run test:launch:smoke` implemented in `scripts/launch-smoke-runner.ts` and writes `.artifacts/launch-smoke-report.json`. (source: package.json, scripts/launch-smoke-runner.ts)
- Launch synthetic monitors: `npm run monitor:launch` implemented in `scripts/run-launch-synthetic-monitors.ts` and uses the launch smoke artifact plus live endpoints. (source: package.json, scripts/run-launch-synthetic-monitors.ts)
- Go/no-go: `npm run go:no-go` implemented in `scripts/go-no-go-check.ts` and requires evidence files, a fresh smoke artifact, healthy monitor routes, required safe-mode flags, and restore-drill assets. (source: package.json, scripts/go-no-go-check.ts)
- Restore drill runbook: `docs/launch-restore-drill.md`.

## Hooks (Repo Truth)

- Pre-commit hook runs `lint-staged` when present. (source: .husky/pre-commit)
- `lint-staged` configuration lives in `package.json`. (source: package.json)
