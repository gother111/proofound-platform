# Local Development

This repo supports two local run modes:

1. Mock mode (no Supabase required). Good for UI smoke checks, `npm run test:a11y`, and mock E2E.
2. Real Supabase mode. Required for end-to-end validation of data, auth, and RLS.

References:

- Setup runbook: `agent/runbooks/setup.md`
- Env var reference: `docs/ENV_VARIABLES.md` and `.env.example`
- Supabase setup guide: `SETUP_SUPABASE.md`

## Prerequisites

- Node `20.20.0` (see `.nvmrc` and `package.json` engines).
- `npm` with `package-lock.json`.

Tip: `npm run dev` and Playwright scripts in this repo use Node 20 wrapper scripts (see `scripts/next-dev-node20.mjs`, `scripts/playwright-node20.mjs`) to avoid accidental Node 16 usage.

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
