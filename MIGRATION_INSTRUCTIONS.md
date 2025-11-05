# 🚀 Database Migration Instructions

## Issue Found

The original migration file referenced an `applications` table that doesn't exist in your database schema. Your system uses `matches` → `conversations` workflow instead.

## ✅ Fixed Migration

I've created a corrected migration that works with your actual schema.

---

## 🪄 DO THIS MANUALLY - Run the Corrected Migration

### Step 1: Open Supabase Dashboard

Go to your **Supabase Dashboard → SQL Editor**

### Step 2: Click "New Query"

### Step 3: Copy and Paste This Corrected SQL

```sql
-- ============================================================================
-- CORRECTED MIGRATIONS - Compatible with Actual Schema
-- ============================================================================

-- Migration 1: Add interviews table (CORRECTED)
-- References match_id instead of application_id
CREATE TABLE IF NOT EXISTS "interviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "match_id" uuid NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
  "scheduled_at" timestamp NOT NULL,
  "duration_minutes" integer DEFAULT 30 NOT NULL,
  "platform" text NOT NULL CHECK ("platform" IN ('zoom', 'google_meet')),
  "meeting_link" text,
  "meeting_id" text,
  "host_user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "participant_user_ids" uuid[] NOT NULL,
  "status" text DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  "rescheduled" boolean DEFAULT false,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "interviews_match_id_idx" ON "interviews"("match_id");
CREATE INDEX IF NOT EXISTS "interviews_host_user_id_idx" ON "interviews"("host_user_id");
CREATE INDEX IF NOT EXISTS "interviews_scheduled_at_idx" ON "interviews"("scheduled_at");
CREATE INDEX IF NOT EXISTS "interviews_status_idx" ON "interviews"("status");

COMMENT ON TABLE "interviews" IS 'Interview scheduling with Zoom/Google Meet integration';

-- Migration 2: Add fairness_reports table
CREATE TABLE IF NOT EXISTS "fairness_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "release_version" text NOT NULL,
  "report_markdown" text NOT NULL,
  "metrics_json" jsonb NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "fairness_reports_release_version_idx" ON "fairness_reports"("release_version");
CREATE INDEX IF NOT EXISTS "fairness_reports_published_at_idx" ON "fairness_reports"("published_at");
CREATE INDEX IF NOT EXISTS "fairness_reports_created_at_idx" ON "fairness_reports"("created_at");

COMMENT ON TABLE "fairness_reports" IS 'Automated fairness analysis reports';
```

### Step 4: Click "Run" (or press Cmd/Ctrl + Enter)

You should see: **"Success. No rows returned"** ✅

---

## 📝 What Changed

### Original Migration (❌ BROKEN)

```sql
"application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE
```

**Problem:** `applications` table doesn't exist!

### Fixed Migration (✅ WORKING)

```sql
"match_id" uuid NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE
```

**Solution:** Uses the actual `matches` table that exists in your schema

---

## 🔄 Workflow Explanation

Your platform's actual workflow:

1. **Matches** are created (candidates matched with assignments)
2. **Conversations** start when mutual interest is expressed
3. **Interviews** can be scheduled from active matches/conversations

So interviews should reference `match_id`, not `application_id`.

---

## ✅ After Running

Verify the migration worked:

```bash
node scripts/check-migration-status.mjs
```

You should see:

- ✅ interviews table migrated
- ✅ fairness_reports table migrated

---

## 🛠️ Need to Update Code

The interview scheduling API code also needs updating to use `match_id`:

**File:** `src/app/api/interviews/schedule/route.ts`

Change:

```typescript
application_id: body.applicationId; // ❌ OLD
```

To:

```typescript
match_id: body.matchId; // ✅ NEW
```

This matches your actual database schema.

---

## 📊 Schema Alignment

After this migration, your schema will be:

- ✅ `matches` table (existing)
- ✅ `conversations` table (existing)
- ✅ `interviews` table (NEW - references matches)
- ✅ `fairness_reports` table (NEW - standalone)

All properly connected! 🎉
