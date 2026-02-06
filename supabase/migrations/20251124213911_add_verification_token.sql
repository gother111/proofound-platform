-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251124213911
-- name: add_verification_token
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Add verification token column for magic link verification
ALTER TABLE skill_verification_requests 
ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE;

-- Add index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_skill_verification_requests_token 
ON skill_verification_requests(verification_token) WHERE verification_token IS NOT NULL;
