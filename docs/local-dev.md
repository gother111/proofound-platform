# Local Development

> Doc Class: `active`
> Last Verified: `2026-05-19`

This repo supports two local run modes:

1. Mock mode (no Supabase required). Good for UI smoke checks, `npm run test:a11y`, and mock E2E.
2. Real Supabase mode. Required for end-to-end validation of data, auth, and RLS.

References:

- Setup runbook: `agent/runbooks/setup.md`
- Env var reference: `docs/ENV_VARIABLES.md` and `.env.example`
- Supabase setup guide: `SETUP_SUPABASE.md`

## Prerequisites

- Node `24.15.0` (see `.nvmrc` and `package.json` engines).
- npm `11.12.1` via `packageManager` in `package.json`.
- `package-lock.json`; use lockfile installs for repeatable verification.

Tip: `npm run dev` and Playwright scripts in this repo use Node 24 wrapper scripts (see `scripts/next-dev-node24.mjs`, `scripts/playwright-node24.mjs`) to avoid accidental runtime drift.

Recommended shell setup:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install
nvm use
node -v
npm -v
```

Expect Node `v24.15.0`. `.npmrc` uses `engine-strict=true`, so unsupported Node versions should fail early instead of producing misleading verification results.

## Install

```bash
npm ci
```

## Run (Mock Supabase)

This starts the app without real Supabase credentials.

```bash
NEXT_PUBLIC_USE_MOCK_SUPABASE=true npm run dev
```

Open:

- Home: `http://localhost:3000/`
- Login: `http://localhost:3000/login`
- Signup: `http://localhost:3000/signup`

Notes:

- The app uses a mock user and mock Supabase client when `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`.
- Without a `DATABASE_URL`, Drizzle falls back to an in-memory mock DB and prints a loud warning on startup.
- Mock Supabase and mock admin/auth flags are local/test only. Production and production deploy checks fail fast if they are enabled.
- Mock mode is useful for Browser and Playwright layout checks, but it is not proof of RLS, auth email delivery, production database behavior, or launch readiness.

Representative local UI checks:

```bash
NEXT_PUBLIC_USE_MOCK_SUPABASE=true npm run dev
npm run test:e2e:landing
npm run test:e2e:auth:mock
npm run test:a11y
```

Use Browser for route inspection when you need rendered desktop/mobile evidence. Record the checked route, viewport, and finding in the relevant artifact or change note.

## Run (Real Supabase)

1. Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

2. Fill in required values (see `docs/ENV_VARIABLES.md`):

- `NEXT_PUBLIC_SITE_URL` (usually `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose to browser code)

3. Start dev server:

```bash
npm run dev
```

4. Seed the shared public org trust fixture used by local and staging smoke checks:

```bash
npm run seed:public-org-trust-fixture
```

Strict or launch-adjacent checks must keep `NEXT_PUBLIC_USE_MOCK_SUPABASE=false` and use a target-specific `.env.local` or `STRICT_ENV_FILE`. Do not paste secrets into tracked files, screenshots, artifacts, or docs.

## Local Postgres (Optional)

If you want a local Postgres database (for example to support deterministic E2E with mock auth), start the included container:

```bash
docker compose up -d
export DATABASE_URL='postgresql://postgres:postgrespassword@127.0.0.1:5432/proofound'
```

Then sync schema:

```bash
npm run db:migrate
```

Stop the DB:

```bash
docker compose down
```

## Launch-Safe Verification

Local development evidence is useful, but it does not replace current target evidence for launch. Before citing readiness, use the active verification checklist and collect fresh proof for the intended target:

- `agent/checklists/verification.md`
- `docs/production-readiness-checklist.md`
- `docs/release-checklist.md`
- `docs/launch-restore-drill.md`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`
