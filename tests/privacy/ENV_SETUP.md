# 🔐 Environment Setup for RLS Privacy Tests

## Prerequisites

Before running the RLS privacy tests, you need to set up a **separate test Supabase project**.

⚠️ **IMPORTANT:** Never run these tests against your production or development database. The tests create and delete data, which could interfere with your application.

## Step 1: Create a Test Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Name it something like "proofound-test" or "proofound-rls-tests"
4. Choose a region (preferably same as your production project)
5. Set a strong database password (save it somewhere secure)
6. Wait for the project to be created (~2 minutes)

## Step 2: Apply Database Schema to Test Project

You need to apply the same schema and RLS policies to your test project:

```bash
# Option 1: Use Supabase CLI (recommended)
supabase db push --project-ref your-test-project-ref

# Option 2: Manually run migrations
# Go to Supabase Dashboard → SQL Editor
# Run the following migrations in order:
# 1. src/db/migrations/*.sql
# 2. src/db/policies.sql
# 3. migrations/001_enable_rls_policies.sql
```

## Step 3: Get API Keys

1. Go to your test project in Supabase Dashboard
2. Navigate to **Settings → API**
3. Copy the following values:

### Project URL
```
https://[your-project-ref].supabase.co
```

### Anon Key (public)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Service Role Key (secret)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **WARNING:** The Service Role key bypasses all RLS policies. Never commit it to git or expose it to the client.

## Step 4: Set Environment Variables

Create a `.env.test` file in the project root (or add to your existing `.env.local`):

```bash
# Test Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://your-test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional
DATABASE_URL=postgresql://postgres:your-password@db.your-test-project.supabase.co:5432/postgres
SITE_URL=http://localhost:3000
```

### Alternative: Use .env.local with test project
If you prefer not to create a separate `.env.test`, you can temporarily point your `.env.local` to the test project when running privacy tests. Just remember to switch it back!

## Step 5: Verify Setup

Test that your environment is configured correctly:

```bash
# This will attempt to connect to Supabase and verify credentials
npm run test:privacy:setup-check
```

If setup is correct, you should see:
```
✅ Supabase URL configured
✅ Anon key configured
✅ Service role key configured
✅ Successfully connected to Supabase
✅ RLS policies are enabled
```

## Step 6: Run the Tests!

```bash
# Run all privacy tests
npm run test:privacy

# Run with verbose output
npm run test:privacy -- --reporter=verbose

# Run specific test file
npm run test:privacy tests/privacy/rls-policies.test.ts
```

## Troubleshooting

### Error: "Missing Supabase credentials"
- Make sure `.env.test` or `.env.local` has the required variables
- Verify the variable names match exactly (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
- Try restarting your terminal/IDE

### Error: "Failed to create test user"
- Check that your Service Role key is correct
- Verify that your test project has email auth enabled (Dashboard → Authentication → Settings)
- Make sure email confirmations are disabled for test users

### Error: "Relation does not exist"
- Your test database is missing tables
- Run the schema migrations (see Step 2)
- Verify you're connected to the correct project

### Tests are slow or timing out
- Tests create real data in Supabase, which can be slow
- Increase timeout in vitest config: `testTimeout: 30000`
- Use a test project in the same region for faster network latency

### Cleanup issues
- If tests fail, they may leave orphaned data
- Run: `npm run test:privacy:cleanup` to manually clean up
- Or use the Supabase Dashboard → Table Editor to delete test records

## Security Best Practices

1. ✅ **DO** use a separate test project
2. ✅ **DO** add `.env.test` to `.gitignore`
3. ✅ **DO** rotate service role keys periodically
4. ❌ **DON'T** commit service role keys to git
5. ❌ **DON'T** run tests against production
6. ❌ **DON'T** share service role keys in screenshots or docs

## Need Help?

If you're stuck, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Vitest Documentation](https://vitest.dev/)
- Project README.md
- tests/privacy/README.md

