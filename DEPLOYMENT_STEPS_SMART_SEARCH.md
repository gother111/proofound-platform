# Deployment Steps for Smart Search Feature

## Quick Summary

This guide walks you through deploying the smart fuzzy search feature that enables typo-tolerant, partial-match searching for skills in the Expertise tab.

## Prerequisites

- PostgreSQL database access (Supabase)
- `psql` or Supabase CLI installed
- Environment variables configured (`.env.local`)

## Step-by-Step Deployment

### 1. Apply Database Migration

**Option A: Using Supabase CLI** (Recommended)

```bash
# Login to Supabase (if not already logged in)
supabase login

# Link to your project
supabase link --project-ref cjpfrgmsxwxhuomnvciq

# Push the migration
supabase db push
```

**Option B: Using psql**

```bash
# Apply the migration directly
psql "$DATABASE_URL" -f supabase/migrations/20251105_add_skills_search_indexes.sql
```

**Option C: Using Supabase Dashboard**

1. Go to https://supabase.com/dashboard/project/cjpfrgmsxwxhuomnvciq
2. Navigate to **SQL Editor**
3. Click **+ New query**
4. Copy content from `supabase/migrations/20251105_add_skills_search_indexes.sql`
5. Paste and click **Run**

### 2. Verify Migration Success

Run this query in your database:

```sql
-- Check if extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent');

-- Check if search_vector column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'skills_taxonomy' AND column_name = 'search_vector';

-- Check if search function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'search_skills_smart';

-- Test the search function
SELECT * FROM search_skills_smart('python', 5);
```

**Expected results:**

- 2 extensions (pg_trgm, unaccent)
- 1 column (search_vector, tsvector type)
- 1 function (search_skills_smart)
- 5 skills related to Python

### 3. Seed Database (If Empty)

Check if you have skills data:

```sql
SELECT COUNT(*) FROM skills_taxonomy;
```

If count is 0 or very low, run the seeding script:

```bash
# Make sure .env.local has these variables:
# NEXT_PUBLIC_SUPABASE_URL=https://cjpfrgmsxwxhuomnvciq.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

npm run db:seed-taxonomy
```

This will seed **18,708 skills** from `data/expertise-atlas-20k-l4-final.json`.

**Expected output:**

```
✅ Seeded 6 L1 domains
✅ Seeded 180 L2 categories
✅ Seeded 1,800 L3 subcategories
✅ Seeded 18,708 L4 skills
```

### 4. Build and Deploy Application

```bash
# Build the application
npm run build

# If build succeeds, deploy
# (Your deployment command here, e.g., vercel deploy)
```

**Note:** There may be some unrelated build errors from missing dependencies (table component, web-vitals). These don't affect the search functionality.

### 5. Test the Feature

**In the application:**

1. Navigate to the Expertise tab
2. Click the **"Add manually"** button
3. Ensure you're in **"Quick Search"** mode (not "Browse Categories")
4. Try these test searches:

| Search Query         | Expected Results                         | Tests           |
| -------------------- | ---------------------------------------- | --------------- |
| `python`             | Python programming, Python testing, etc. | Exact match     |
| `pythn`              | Python-related skills                    | Typo tolerance  |
| `react`              | React, ReactJS, React Native             | Partial match   |
| `javascrpt`          | JavaScript skills                        | Typo + fuzzy    |
| `project management` | PM-related skills                        | Phrase matching |

**What to look for:**

- ✅ Results appear within 1-2 seconds
- ✅ Typos still find relevant skills
- ✅ Partial words work (e.g., "prog" finds "programming")
- ✅ Selecting a skill auto-populates L1/L2/L3
- ✅ No loading state gets stuck

**In the browser console:**

- Look for: `✅ Skills search for "python" returned X results`
- Should NOT see: `Smart search error` (unless testing fallback)

### 6. Monitor Performance

Check the server logs for search performance:

```bash
# Look for these log messages:
# ✅ Skills search for "query" returned X results
# Smart search error: ... (should only appear if migration failed)
# Falling back to basic search... (fallback mode indicator)
```

**Performance targets:**

- Search latency: < 200ms (p95)
- Fallback usage: 0% (after migration)
- Error rate: < 0.1%

## Rollback Plan

If something goes wrong, you can rollback the changes:

### Rollback Option 1: Revert API Changes

```bash
# Revert to the commit before smart search
git revert HEAD
git push
```

The API will work in fallback mode with basic substring matching.

### Rollback Option 2: Drop Database Objects

```sql
-- Drop the search function
DROP FUNCTION IF EXISTS search_skills_smart(TEXT, INTEGER);

-- Drop the search vector column (optional, can keep it)
ALTER TABLE skills_taxonomy DROP COLUMN IF EXISTS search_vector;

-- Drop the indexes
DROP INDEX IF EXISTS idx_skills_taxonomy_search_vector;
DROP INDEX IF EXISTS idx_skills_taxonomy_name_trgm;
DROP INDEX IF EXISTS idx_skills_taxonomy_desc_trgm;
DROP INDEX IF EXISTS idx_skills_taxonomy_aliases_trgm;

-- Note: Don't drop extensions if other tables use them
-- DROP EXTENSION IF EXISTS pg_trgm;
-- DROP EXTENSION IF EXISTS unaccent;
```

## Troubleshooting

### Problem: Migration fails with "permission denied"

**Solution:** Make sure you're using the service role key, not the anon key:

```bash
# Check your .env.local
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

### Problem: Search returns no results

**Checklist:**

1. ✅ Migration applied? Run: `SELECT * FROM search_skills_smart('test', 5);`
2. ✅ Data seeded? Run: `SELECT COUNT(*) FROM skills_taxonomy;` (should be > 18,000)
3. ✅ Query length? Must be at least 2 characters
4. ✅ Browser console? Check for API errors

### Problem: Search is slow (> 1 second)

**Checklist:**

1. ✅ Indexes created? Run: `\di` in psql, look for `idx_skills_taxonomy_*`
2. ✅ Statistics updated? Run: `VACUUM ANALYZE skills_taxonomy;`
3. ✅ Database size? Run: `SELECT pg_size_pretty(pg_database_size(current_database()));`

### Problem: Build fails

The build might fail due to unrelated issues:

- Missing `@/components/ui/table` component
- Missing `web-vitals` package

These don't affect the search feature. Install missing dependencies:

```bash
npm install web-vitals
# Or create the missing table component
```

### Problem: "Falling back to basic search" in logs

This means the migration wasn't applied. The app will work but without fuzzy matching.

**Solution:**

1. Apply the migration (see Step 1)
2. Restart the application
3. Test again

## Post-Deployment Verification

### Verify with SQL

```sql
-- 1. Check data count
SELECT
    'Total skills' as metric,
    COUNT(*) as value
FROM skills_taxonomy
UNION ALL
SELECT
    'Skills with search_vector',
    COUNT(*)
FROM skills_taxonomy
WHERE search_vector IS NOT NULL
UNION ALL
SELECT
    'Active skills',
    COUNT(*)
FROM skills_taxonomy
WHERE status = 'active';

-- 2. Test search quality
SELECT
    name_i18n->>'en' as skill_name,
    relevance_score,
    match_type
FROM search_skills_smart('pythn', 10)  -- Intentional typo
ORDER BY relevance_score DESC;

-- 3. Check index usage (requires pg_stat_statements)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'skills_taxonomy'
ORDER BY idx_scan DESC;
```

### Verify in Application

Create a checklist:

- [ ] Search "python" returns results
- [ ] Search "pythn" (typo) returns Python skills
- [ ] Search "react" returns all React variants
- [ ] Search "prog" returns programming skills
- [ ] Selecting a skill auto-fills L1/L2/L3
- [ ] Error messages display correctly on network issues
- [ ] Loading state works (not stuck)
- [ ] Search is fast (< 2 seconds)

## Success Criteria

### ✅ Deployment is successful if:

1. **Migration applied:** `search_skills_smart()` function exists
2. **Data seeded:** 18,000+ skills in database
3. **Search works:** API returns results for test queries
4. **No fallback:** Logs show "Smart search" not "Fallback"
5. **Performance good:** < 200ms search latency
6. **Typos work:** "pythn" finds "Python"
7. **No errors:** No console errors or API failures

## Next Steps

After successful deployment:

1. **Monitor usage:**
   - Track search queries
   - Monitor error rates
   - Check performance metrics

2. **Gather feedback:**
   - Ask users about search quality
   - Collect common queries
   - Identify missing skills

3. **Iterate:**
   - Adjust relevance scoring
   - Add missing skills
   - Consider vector embeddings for semantic search

## Support

If you encounter issues not covered here:

1. Check `SMART_SEARCH_IMPLEMENTATION.md` for technical details
2. Review server logs for error messages
3. Test the database function directly in SQL
4. Verify environment variables are correct

## Files Changed in This Deployment

- `supabase/migrations/20251105_add_skills_search_indexes.sql` - NEW
- `src/app/api/expertise/taxonomy/route.ts` - MODIFIED
- `src/app/app/i/expertise/components/AddSkillDrawer.tsx` - PREVIOUSLY MODIFIED
- `SMART_SEARCH_IMPLEMENTATION.md` - NEW (documentation)
- `DEPLOYMENT_STEPS_SMART_SEARCH.md` - NEW (this file)
