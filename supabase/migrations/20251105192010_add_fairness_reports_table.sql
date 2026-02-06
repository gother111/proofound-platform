-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251105192010
-- name: add_fairness_reports_table
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
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
