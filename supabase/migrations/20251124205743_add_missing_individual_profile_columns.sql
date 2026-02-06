-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251124205743
-- name: add_missing_individual_profile_columns
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Add missing columns to individual_profiles table
ALTER TABLE individual_profiles 
ADD COLUMN IF NOT EXISTS field_visibility jsonb,
ADD COLUMN IF NOT EXISTS redact_mode boolean DEFAULT false;

-- Add missing column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tour_completed boolean DEFAULT false;
