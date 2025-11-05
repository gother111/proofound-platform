# Manual Migration Instructions

Since the Supabase CLI isn't linked yet, you can apply migrations manually via the Supabase Dashboard.

## Steps:

### 1. Go to your Supabase Dashboard

Visit: https://supabase.com/dashboard/project/YOUR-PROJECT-ID/sql/new

### 2. Apply Migration 1: Staged Messaging System

Copy the entire contents of:

```
/Users/yuriibakurov/proofound/supabase/migrations/20251106_staged_messaging_system.sql
```

Paste into the SQL Editor and click **Run**.

**What this creates:**

- `conversations` table (17 columns)
- `messages` table (12 columns)
- 12+ RLS policies
- Helper functions for masked handles
- Triggers for auto-reveal
- Indexes for performance

### 3. Apply Migration 2: Verification Privacy

Copy the entire contents of:

```
/Users/yuriibakurov/proofound/supabase/migrations/20251107_verification_privacy.sql
```

Paste into the SQL Editor and click **Run**.

**What this creates:**

- `verification_requests` table (19 columns)
- 15+ RLS policies
- Rate limiting views
- Token expiration functions
- Analytics integration

### 4. Verify Success

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

### 5. Check RLS Policies

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
