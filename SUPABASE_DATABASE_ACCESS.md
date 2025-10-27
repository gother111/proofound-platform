# Supabase PostgreSQL Database Access Guide

This guide shows you how to access and manage your Supabase PostgreSQL database for the Proofound MVP.

---

## 🎯 Quick Access Methods

### Method 1: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Log in with your Supabase account

2. **Select Your Project**
   - Find and click on your Proofound project

3. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query** button

4. **Run SQL Scripts**
   - Copy and paste SQL from migration files
   - Click **Run** or press `Ctrl/Cmd + Enter`

---

### Method 2: psql Command Line

**Get Connection String:**

1. Go to Supabase Dashboard → Project Settings → Database
2. Look for "Connection string" section
3. Choose "Session mode" or "Transaction mode"

**Connection String Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**Connect via psql:**
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

---

### Method 3: Database Client (TablePlus, DBeaver, pgAdmin)

**Connection Details:**

- **Host:** `db.[YOUR-PROJECT-REF].supabase.co`
- **Port:** `5432`
- **Database:** `postgres`
- **Username:** `postgres`
- **Password:** Your Supabase database password
- **SSL Mode:** `require`

**Popular Clients:**
- **TablePlus** (Mac, Windows, Linux) - https://tableplus.com
- **DBeaver** (Free, all platforms) - https://dbeaver.io
- **pgAdmin** (Free PostgreSQL GUI) - https://www.pgadmin.org
- **Postico** (Mac) - https://eggerapps.at/postico/

---

## 📂 Running Migration and Seed Scripts

### Step 1: Run Initial Schema Migration

**File:** `supabase/migrations/00_initial_schema.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `00_initial_schema.sql`
3. Paste into SQL Editor
4. Click **Run**

This creates all tables: profiles, organizations, assignments, matches, messages, expertise_atlas, proofs, etc.

### Step 2: Run Waitlist Table Migration

**File:** `supabase/migrations/20250127_subscription_waitlist.sql`

1. Open SQL Editor → New Query
2. Copy contents of `20250127_subscription_waitlist.sql`
3. Paste and run

This creates the subscription_waitlist table for collecting interest in paid features.

### Step 3: Run Demo Data Seed

**File:** `supabase/seed/demo_profiles.sql`

1. Open SQL Editor → New Query
2. Copy contents of `demo_profiles.sql`
3. Paste and run

This creates:
- 5 individual demo profiles
- 3 organization profiles
- 6 job assignments
- 35+ skills
- 20+ proofs
- Artifacts and analytics data

**⚠️ Important:** Demo profiles require Supabase Auth users to exist first!

---

## 🔐 Creating Demo User Accounts

### Option A: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter email (e.g., `sofia.martinez@proofound-demo.com`)
4. Set password (e.g., `Demo123!`)
5. Click **Create User**
6. Repeat for all 5 demo profiles

### Option B: Via SQL (After Auth Users Exist)

```sql
-- Make an existing user an admin
UPDATE profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

---

## 🧪 Verify Data Installation

After running migrations and seeds, verify with these queries:

### Check Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check Demo Profiles
```sql
SELECT
  full_name,
  email,
  region,
  profile_completion_percentage || '%' as completion,
  CASE WHEN available_for_match THEN 'Available' ELSE 'Not Available' END as status
FROM profiles
WHERE email LIKE '%proofound-demo.com'
ORDER BY full_name;
```

### Check Organizations
```sql
SELECT
  name,
  org_type,
  headquarters_location,
  is_verified,
  active_assignments_count
FROM organizations
ORDER BY name;
```

### Check Assignments
```sql
SELECT
  a.title,
  o.name as organization,
  a.assignment_type,
  a.status,
  a.location
FROM assignments a
JOIN organizations o ON a.organization_id = o.id
ORDER BY a.created_at DESC;
```

### Check Expertise
```sql
SELECT
  p.full_name,
  COUNT(e.id) as skill_count
FROM profiles p
LEFT JOIN expertise_atlas e ON e.profile_id = p.id
WHERE p.account_type = 'individual'
GROUP BY p.full_name
ORDER BY skill_count DESC;
```

---

## 🔄 Reset Database (Careful!)

If you need to start fresh:

```sql
-- WARNING: This will delete ALL data!

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS artifacts CASCADE;
DROP TABLE IF EXISTS proofs CASCADE;
DROP TABLE IF EXISTS expertise_atlas CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS subscription_waitlist CASCADE;

-- Then re-run all migrations
```

---

## 📊 Useful Admin Queries

### View All Users
```sql
SELECT
  p.full_name,
  p.email,
  p.account_type,
  p.is_admin,
  p.profile_completion_percentage,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC;
```

### Check Waitlist Signups
```sql
SELECT
  full_name,
  email,
  product_interest,
  account_type,
  created_at
FROM subscription_waitlist
ORDER BY created_at DESC;
```

### Platform Activity Stats
```sql
SELECT
  'Total Users' as metric,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 'Organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'Published Assignments', COUNT(*) FROM assignments WHERE status = 'published'
UNION ALL
SELECT 'Active Matches', COUNT(*) FROM matches WHERE status != 'expired'
UNION ALL
SELECT 'Verified Proofs', COUNT(*) FROM proofs WHERE verification_status = 'verified';
```

---

## 🔒 Security Best Practices

1. **Never commit database passwords** to git
2. **Use environment variables** for connection strings
3. **Enable Row Level Security (RLS)** on all tables (already done in migrations)
4. **Rotate passwords** regularly in production
5. **Use least privilege** - only grant necessary permissions
6. **Enable SSL** for all connections
7. **Monitor query performance** via Supabase Dashboard → Database → Query Performance

---

## 🆘 Troubleshooting

### Issue: "relation does not exist"
**Solution:** Run the migration script first: `00_initial_schema.sql`

### Issue: "insert or update on table violates foreign key constraint"
**Solution:** Create Supabase Auth users before running demo seed script

### Issue: "permission denied for table"
**Solution:** Check RLS policies. Admins should have access to all tables.

### Issue: Can't connect to database
**Solution:** Check your connection string and password. Ensure SSL is enabled.

### Issue: Queries timing out
**Solution:** Check Supabase Dashboard → Database → Query Performance. Consider adding indexes.

---

## 📚 Additional Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Supabase SQL Editor Guide:** https://supabase.com/docs/guides/database/sql-editor
- **RLS Policies Guide:** https://supabase.com/docs/guides/auth/row-level-security

---

## 🎯 Quick Commands Reference

```sql
-- List all tables
\dt

-- Describe table structure
\d profiles

-- List all databases
\l

-- Show current database
SELECT current_database();

-- Show current user
SELECT current_user;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**Last Updated:** January 27, 2025
**For:** Proofound MVP
