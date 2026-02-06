-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251208185350
-- name: 20251208_add_profile_deletion_columns
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Add missing profile deletion fields used by cron workflows
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Helpful indexes for cron lookups
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled_for
  ON profiles (deletion_scheduled_for);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted
  ON profiles (deleted);
