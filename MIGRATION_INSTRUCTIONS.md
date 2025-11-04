# 🗄️ Database Migration Instructions

## Overview
This document explains how to apply all the database migrations for the Proofound platform.

---

## 📋 What's Being Added

### New Tables:
1. **`self_assessments`** - Stores PHQ-2 and GAD-2 mental health assessments
2. **`work_schedules`** - Tracks weekly work hours for burnout monitoring
3. **`dashboard_layouts`** - Saves user's customized dashboard widget preferences

### Enhanced Tables:
1. **`individual_profiles`** - Added `field_visibility` and `redact_mode` for privacy controls
2. **`matches`** - Added `snoozed_until`, `subscores`, `rank`, `rank_band`, `skills_match`, `pac`, `constraints`
3. **`interviews`** - Added `meeting_link` and `meeting_provider` for Zoom/Google Meet integration
4. **`dashboard_layouts`** - Added `widget_size`, `widget_order`, `widget_config`

---

## 🚀 How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `cjpfrgmsxwxhuomnvciq`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Migration Script**
   - Open the file: `/Users/yuriibakurov/proofound/migrations-to-run.sql`
   - Copy all contents
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd+Enter)

4. **Verify Success**
   - You should see "Success. No rows returned" at the bottom
   - The verification query will show all tables with `exists = true`

---

### Option 2: Command Line (If Network Issues Resolved)

```bash
cd /Users/yuriibakurov/proofound

# Load environment variables and run migrations
export $(cat .env.local | grep -v '^#' | xargs)
npx drizzle-kit push:pg --config=drizzle.config.ts
```

---

### Option 3: Direct SQL Connection

If you have `psql` installed:

```bash
cd /Users/yuriibakurov/proofound

# Run the migration script directly
psql "postgresql://postgres:Gara1299442!@db.cjpfrgmsxwxhuomnvciq.supabase.co:5432/postgres?sslmode=require" \
  -f migrations-to-run.sql
```

---

## ✅ Verification Steps

After running migrations, verify in Supabase Dashboard:

1. **Check Tables Exist**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'self_assessments',
     'work_schedules',
     'dashboard_layouts'
   );
   ```

2. **Check New Columns**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'individual_profiles' 
   AND column_name IN ('field_visibility', 'redact_mode');
   ```

3. **Check Indexes**
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE tablename IN ('self_assessments', 'work_schedules', 'matches');
   ```

---

## 🛡️ Safety Features

- ✅ All migrations use `IF NOT EXISTS` clauses
- ✅ No data is deleted or modified
- ✅ Foreign key constraints protect data integrity
- ✅ Indexes added for optimal performance
- ✅ Can be run multiple times safely (idempotent)

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution:** This is safe to ignore. The migration script is idempotent.

### Error: "column already exists"
**Solution:** This is safe to ignore. The `DO $$ BEGIN ... EXCEPTION` blocks handle this.

### Error: "permission denied"
**Solution:** Ensure you're using the `postgres` user connection string (not the anon key).

### Network timeout errors
**Solution:** Use Option 1 (Supabase Dashboard) instead of command line.

---

## 📊 Migration Summary

| Migration | Description | Tables Added | Columns Added |
|-----------|-------------|--------------|---------------|
| 0004 | Dashboard, Assignments | 4 | - |
| 0005 | Self-Assessments, Privacy | 1 | 2 |
| 0006 | Work Schedules | 1 | - |
| Updates | Match enhancements | - | 8 |
| Updates | Interview integrations | - | 2 |
| Updates | Dashboard improvements | - | 3 |

**Total:** 6 new tables, 15+ new columns

---

## 🎯 Next Steps After Migration

1. ✅ Test new features in development
2. ✅ Run linting to fix any TypeScript errors
3. ✅ Test first-run tour for new users
4. ✅ Verify privacy controls work correctly
5. ✅ Test well-being tracking features
6. ✅ Configure OAuth for Zoom/Google (production)

---

## 📞 Need Help?

If you encounter any issues:
1. Check the error message in Supabase logs
2. Verify your database connection string
3. Ensure you have proper permissions
4. Try running migrations in smaller batches

---

**Generated:** November 4, 2025  
**Project:** Proofound Platform  
**Version:** 1.0.0

