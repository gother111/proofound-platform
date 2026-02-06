# Manual Migration Instructions

Prefer applying migrations via `supabase db push` (remote). Only use the Dashboard for emergency hotfixes.

## Recommended: Apply Via CLI (Remote)

This repo uses the Supabase pooler (`:6543`), which requires disabling prepared statement caching for the Supabase CLI.

1. Read `DATABASE_URL` from `.env.local`.
2. Percent-encode the password portion (but not the entire URL).
3. Append pooler-safe params:
   - `statement_cache_capacity=0`
   - `prefer_simple_protocol=true`
   - `pgbouncer=true`
4. Run:

```bash
supabase db push --db-url "postgresql://...:6543/postgres?sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true" --dry-run
supabase db push --db-url "postgresql://...:6543/postgres?sslmode=require&statement_cache_capacity=0&prefer_simple_protocol=true&pgbouncer=true" --yes
```

## Notes On Legacy Migration Files

Some older migration scripts (for example staged messaging + verification privacy) are **not safe to re-apply** on an already-migrated database (they include non-idempotent `CREATE POLICY` / `CREATE INDEX` statements). Those files are kept for reference under:

`supabase/migrations_legacy/`

The canonical migration history is the remote `supabase_migrations.schema_migrations` table.

## Verify Success (Remote)

Run this query to confirm tables were created:

```sql
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'messages', 'verification_requests')
ORDER BY table_name;
```

Expected result:

- conversations: 17 columns
- messages: 12 columns
- verification_requests: 19 columns

Check RLS policy counts:

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'verification_requests')
GROUP BY tablename
ORDER BY tablename;
```

Expected:

- conversations: ~8 policies
- messages: ~4 policies
- verification_requests: ~6 policies

---

## ✅ Success!

Once both migrations are applied, your staged messaging and verification privacy systems are live!
