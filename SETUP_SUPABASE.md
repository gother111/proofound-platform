# Supabase Setup (Local Dev)

This repo uses Supabase for Auth and Postgres. Local secrets live in `.env.local` (gitignored). Do not commit keys.

## 1. Create `.env.local`

Recommended: copy the template and fill values.

```bash
cp .env.example .env.local
```

Alternatively, you can run the helper (safe, no secrets):

```bash
node update-env.cjs
```

## 2. Fill Required Variables

Edit `.env.local` and set at minimum:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Notes:

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in browser code.
- If you use the Supabase pooler (`:6543`), add pooler-safe params when running the Supabase CLI:
  - `statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true`
- `DIRECT_URL` is optional. Drizzle will use it when set, otherwise it falls back to `DATABASE_URL`.

## 3. Where To Get Values (Supabase Dashboard)

- Project URL and keys: Supabase Dashboard -> Project Settings -> API
  - Use the `anon` public key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Use the `service_role` key for `SUPABASE_SERVICE_ROLE_KEY`
- Database connection string: Supabase Dashboard -> Project Settings -> Database -> Connection string

## 4. Verify

Run the repo verifier:

```bash
npm run db:verify
```

Then start the app and check health:

```bash
npm run dev
curl http://localhost:3000/api/health
```
