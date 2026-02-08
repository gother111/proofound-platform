# How to Run Critical Gaps Migrations

## Recommended Method: Supabase CLI (Remote)

This repo uses Supabase migrations (tracked in `supabase/migrations/`). The canonical migration history is stored remotely in `supabase_migrations.schema_migrations`.

Because the remote DB is accessed via the Supabase pooler (`:6543`), the Supabase CLI must be run with pooler-safe settings (disable prepared statement caching).

1. Ensure `.env.local` has `DATABASE_URL`.
2. Build a CLI connection string where:
   - the password is percent-encoded
   - the URL includes: `sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true`
3. Run:

```bash
supabase db push --db-url "postgresql://...:6543/postgres?sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true" --dry-run
supabase db push --db-url "postgresql://...:6543/postgres?sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true" --yes
```

## Verification

If you need to confirm critical gaps tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('interviews', 'fairness_reports', 'matching_profiles')
order by table_name;
```

## ⚠️ Troubleshooting

If the Supabase CLI errors with prepared statement collisions, the DB URL is missing one of:

- `statement_cache_capacity=0`
- `prefer_simple_protocol=true`
- `pgbouncer=true`

### "Remote migration versions not found in local migrations directory"

If `supabase db push` fails because the remote `supabase_migrations.schema_migrations` contains versions that are missing as local files under `supabase/migrations/`, sync local placeholder files first:

```bash
node agent/tools/supabase-sync-migration-history.mjs
supabase db push --db-url "postgresql://...:6543/postgres?sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true" --dry-run
```

**If you get permission errors:**

- Make sure you're logged in as the project owner
- Check that you have database access enabled
