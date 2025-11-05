-- ============================================================================
-- CORRECTED MIGRATIONS - Compatible with Actual Schema
-- ============================================================================
-- These migrations work with your existing matches → conversations workflow
-- Instead of referencing non-existent "applications" table
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "interviews_match_id_idx" ON "interviews"("match_id");
CREATE INDEX IF NOT EXISTS "interviews_host_user_id_idx" ON "interviews"("host_user_id");
CREATE INDEX IF NOT EXISTS "interviews_scheduled_at_idx" ON "interviews"("scheduled_at");
CREATE INDEX IF NOT EXISTS "interviews_status_idx" ON "interviews"("status");

-- Add comment
COMMENT ON TABLE "interviews" IS 'Interview scheduling with Zoom/Google Meet integration - uses match_id not application_id';

-- Migration 2: Add fairness_reports table (unchanged - this one is fine)
CREATE TABLE IF NOT EXISTS "fairness_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "release_version" text NOT NULL,
  "report_markdown" text NOT NULL,
  "metrics_json" jsonb NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for querying
CREATE INDEX IF NOT EXISTS "fairness_reports_release_version_idx" ON "fairness_reports"("release_version");
CREATE INDEX IF NOT EXISTS "fairness_reports_published_at_idx" ON "fairness_reports"("published_at");
CREATE INDEX IF NOT EXISTS "fairness_reports_created_at_idx" ON "fairness_reports"("created_at");

-- Add comment
COMMENT ON TABLE "fairness_reports" IS 'Automated fairness analysis reports - PRD Gap 3';

