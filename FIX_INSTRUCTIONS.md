# Fix for Empty Expertise Tab - FINAL SOLUTION

## Problem Identified

The seeding script created skills with `skill_code = NULL` because:

1. Old demo data existed in the database
2. The script tried to insert new records but hit duplicate key errors
3. It silently skipped the inserts, leaving old NULL values

## Solution Applied

Added a `cleanupDemoData()` function that:

- Deletes all existing skills for demo users
- Deletes all projects, experiences, education, etc.
- Runs BEFORE seeding new data
- Ensures fresh data with proper taxonomy codes

## Run This Command

```bash
cd .
node scripts/seed-demo-users.mjs --yes
```

## Expected Output

You should see:

```
🧹 Cleaning up existing demo data...
   ✓ Deleted existing skills
   ✓ Deleted existing projects
   ✓ Deleted existing impact stories
   ✓ Deleted existing experiences
   ✓ Deleted existing education
   ✓ Deleted existing volunteering
   ✅ Cleanup complete

📝 Seeding profiles and individual_profiles...
   ✅ Created 5 profiles

🎯 Seeding skills...
   ✅ Created 42 skills

... (more output)

✅ SEEDING COMPLETE!
```

## Verification

After running, check with:

```bash
node scripts/check-database-state.mjs
```

You should see:

- ✅ Found 8 skills
- ✅ All skills have skill_code (no NULL values)
- ✅ Taxonomy records found

## Test in Browser

1. Refresh Sofia's Expertise tab
2. You should now see:
   - L1 domain cards with skill counts
   - Skills organized hierarchically
   - Dashboard widgets with data

## What Changed

**File: `scripts/seed-demo-users.mjs`**

- Added `cleanupDemoData()` function (lines 1256-1339)
- Calls cleanup before seeding (line 1371)
- Now properly deletes old data before inserting new

**File: `src/app/app/i/expertise/page.tsx`**

- Added console.log debugging (temporary - can be removed later)
- Helps diagnose data loading issues

## If Still Empty

Check server logs (terminal where `npm run dev` is running) for:

```
🔍 [Expertise Page] Skills query result: { count: 8, ... }
🔍 [Expertise Page] Skill codes to fetch: ['02.052.412.04194', ...]
```

If you see `count: 0`, the seeding didn't work.
If you see skill codes as empty array, skill_code is still NULL.
