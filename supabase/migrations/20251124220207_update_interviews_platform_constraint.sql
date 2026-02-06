-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251124220207
-- name: update_interviews_platform_constraint
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================

-- Update the platform constraint to include 'manual' option
ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_platform_check;

ALTER TABLE interviews ADD CONSTRAINT interviews_platform_check 
CHECK (platform = ANY (ARRAY['zoom'::text, 'google_meet'::text, 'manual'::text]));
