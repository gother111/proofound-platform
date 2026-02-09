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
nvm install 20.20.0
nvm use 20.20.0
node -v  # expect v20.20.0
```

## Environment Variables (Repo Truth)

- Start from `.env.example` and the reference guide in `docs/ENV_VARIABLES.md`. (source: .env.example, docs/ENV_VARIABLES.md)
- Do not commit secret env files; `.gitignore` excludes `.env` and `*.local` patterns. (source: .gitignore)

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

Notes:

- `ZOOM_REDIRECT_URI` and `GOOGLE_REDIRECT_URI` must match the redirect URIs configured in the provider consoles.
- Callbacks validate an httpOnly state cookie set during connect (`zoom_oauth_state`, `google_oauth_state`). If the cookie is missing (for example, using a different domain, or blocked cookies), the callback will fail.

## Install Dependencies

- CI installs dependencies via `npm ci`. (source: .github/workflows/ci.yml)
- Guidance: Local installs typically use `npm install` (standard npm workflow). **Note:** not required for docs-only changes.

## Core Commands (Repo Truth)

- Dev server: `npm run dev` (source: package.json)
- Build: `npm run build` (source: package.json)
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
- Read-only DB verifier:
  - `npm run db:verify` (checks required tables/views/functions/extensions and flags Supabase URL vs DB URL mismatch) (source: package.json, scripts/db-verify.mjs)
- SQL runner:
  - `npm run db:migrate` runs `node run-migrations.mjs` which applies `migrations-to-run.sql`. (source: package.json, run-migrations.mjs, migrations-to-run.sql)
- Manual migration docs:
  - `RUN_MIGRATIONS_GUIDE.md`, `APPLY_MIGRATIONS_MANUAL.md` (source: RUN_MIGRATIONS_GUIDE.md, APPLY_MIGRATIONS_MANUAL.md)
  - Note: Supabase CLI pushes should use `--include-all` for this project due to a far-future remote migration (`99999999999999_seed_expertise_atlas_skills`). (source: RUN_MIGRATIONS_GUIDE.md)

## E2E / Accessibility (Repo Truth)

- E2E: `npm run test:e2e` (Playwright config in `playwright.config.ts`) (source: package.json, playwright.config.ts)
- A11y: `npm run test:a11y` (source: package.json)
  - TODO: Validate `playwright.a11y.config.ts` exists; do not create it as part of docs bootstrap. (source: package.json)

## CI Gates Beyond Tests (Repo Truth)

- CI runs perf budgets and go/no-go after starting the app. (source: .github/workflows/ci.yml)
- Perf budgets: `npm run perf:budgets` implemented in `scripts/perf-budgets.mjs`. (source: package.json, scripts/perf-budgets.mjs)
- Go/no-go: `npm run go:no-go` implemented in `scripts/go-no-go-check.mjs` and requires evidence files. (source: package.json, scripts/go-no-go-check.mjs)
  - TODO: Ensure required evidence files exist before relying on `go:no-go`. Do not invent missing evidence. (source: scripts/go-no-go-check.mjs)

## Hooks (Repo Truth)

- Pre-commit hook runs `lint-staged` when present. (source: .husky/pre-commit)
- `lint-staged` configuration lives in `package.json`. (source: package.json)

## Vercel Preview Deployment Protection (401)

Symptom:

- A Preview `*.vercel.app` URL returns HTTP 401 and shows "Vercel Authentication" instead of the app.

Fix options:

- Dashboard: Project Settings -> Deployment Protection. Disable protection for Preview deployments.
- API (requires `VERCEL_TOKEN`):
  - Inspect current project setting:
    - `curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/<projectName>" | jq '{ ssoProtection }'`
  - Disable protection:
    - `curl -sS -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" "https://api.vercel.com/v9/projects/<projectName>" -d '{"ssoProtection": null}'`
  - Rollback: set `ssoProtection` back to the previous value returned by the "inspect" step.
