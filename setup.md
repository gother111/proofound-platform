# Setup

## Requirements (Repo Truth)

- Node: `>=20.20.0 <21` (enforced via engines). (`/Users/yuriibakurov/proofound/package.json:3`)
- Build command: `next build` via `npm run build`. (`/Users/yuriibakurov/proofound/package.json:9`)
- Typecheck command: `tsc --noEmit` via `npm run typecheck`. (`/Users/yuriibakurov/proofound/package.json:13`)

## Local Setup

1. Install deps:
   - `npm ci`
2. Validate toolchain:
   - `node -v` should be `v20.x`

## Remote Supabase Migrations (Source Of Truth)

The canonical migration history lives in the remote database table:

- `supabase_migrations.schema_migrations`

Apply/push migrations with the Supabase CLI:

1. Use `.env.local:DATABASE_URL` (this repo uses the Supabase pooler on `:6543`).
2. Ensure the password portion is percent-encoded (do not percent-encode the entire URL).
3. Append pooler-safe params (avoids prepared statement collisions):
   - `statement_cache_capacity=0`
   - `prefer_simple_protocol=true`
   - `pgbouncer=true`
4. Run:

```bash
supabase db push --db-url "postgresql://...:6543/postgres?sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true" --dry-run
supabase db push --db-url "postgresql://...:6543/postgres?sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true" --yes
```

## CI Gates (Recommended)

- `npm run typecheck` (`tsc --noEmit`). (`/Users/yuriibakurov/proofound/package.json:13`)
- `npm run lint` (repo wrapper: `node ./scripts/lint-or-skip.js`). (`/Users/yuriibakurov/proofound/package.json:11`)
- `npm test` (Vitest non-watch). (`/Users/yuriibakurov/proofound/package.json:21`)
- `npm run build` (`next build`). (`/Users/yuriibakurov/proofound/package.json:9`)

## Notes

- `prebuild` runs `scripts/check-deploy-readiness.mjs` but does not currently fail builds (`|| true`). (`/Users/yuriibakurov/proofound/package.json:7`)
- If `DATABASE_URL` is missing locally, DB falls back to an in-memory mock and prints a loud warning; production runtime still requires `DATABASE_URL` (except during Next build phase). (`/Users/yuriibakurov/proofound/src/db/index.ts:31`)
