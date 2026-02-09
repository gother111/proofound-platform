-- Create dashboard_layouts table if it doesn't exist (from migration 0004)
CREATE TABLE IF NOT EXISTS "dashboard_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
	"widget_id" text NOT NULL,
	"position" integer NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"size" text DEFAULT 'default',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dashboard_layouts_user_id_widget_id_unique" UNIQUE("user_id","widget_id")
);

-- Migration 0005: Self Assessments and Field Visibility
-- =====================================================

CREATE TABLE IF NOT EXISTS "self_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"assessment_type" text NOT NULL,
	"score" integer NOT NULL,
	"severity" text NOT NULL,
	"responses" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "self_assessments_assessment_type_check" CHECK (assessment_type IN ('phq2', 'gad2'))
);

DO $$ BEGIN
 ALTER TABLE "self_assessments" ADD CONSTRAINT "self_assessments_user_id_profiles_id_fk" 
 FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add field visibility and redact mode to individual_profiles
DO $$ BEGIN
  ALTER TABLE "individual_profiles" ADD COLUMN IF NOT EXISTS "field_visibility" jsonb;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "individual_profiles" ADD COLUMN IF NOT EXISTS "redact_mode" boolean DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Migration 0006: Work Schedules
-- =====================================================

CREATE TABLE IF NOT EXISTS "work_schedules" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"monday" numeric DEFAULT '0' NOT NULL,
	"tuesday" numeric DEFAULT '0' NOT NULL,
	"wednesday" numeric DEFAULT '0' NOT NULL,
	"thursday" numeric DEFAULT '0' NOT NULL,
	"friday" numeric DEFAULT '0' NOT NULL,
	"saturday" numeric DEFAULT '0' NOT NULL,
	"sunday" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_user_id_profiles_id_fk" 
 FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Additional columns for matches table (if not exists)
-- =====================================================

DO $$ BEGIN
  ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "snoozed_until" timestamp;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "subscores" jsonb;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "rank" integer;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "total_candidates" integer;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "rank_band" text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "skills_match" jsonb;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "pac" jsonb;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "constraints" jsonb;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Dashboard layouts table improvements
-- =====================================================

DO $$ BEGIN
  ALTER TABLE "dashboard_layouts" ADD COLUMN IF NOT EXISTS "widget_size" text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "dashboard_layouts" ADD COLUMN IF NOT EXISTS "widget_order" integer;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "dashboard_layouts" ADD COLUMN IF NOT EXISTS "widget_config" jsonb;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Interviews table for meeting links (if table exists)
-- =====================================================

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interviews') THEN
    ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "meeting_link" text;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interviews') THEN
    ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "meeting_provider" text;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS "idx_self_assessments_user_id" ON "self_assessments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_self_assessments_created_at" ON "self_assessments"("created_at");
CREATE INDEX IF NOT EXISTS "idx_work_schedules_user_id" ON "work_schedules"("user_id");
CREATE INDEX IF NOT EXISTS "idx_matches_snoozed_until" ON "matches"("snoozed_until");
CREATE INDEX IF NOT EXISTS "idx_dashboard_layouts_user_id" ON "dashboard_layouts"("user_id");
