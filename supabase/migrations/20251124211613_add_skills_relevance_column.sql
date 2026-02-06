-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251124211613
-- name: add_skills_relevance_column
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================

-- Add relevance column to skills table for tracking skill currency
ALTER TABLE skills ADD COLUMN IF NOT EXISTS relevance TEXT 
CHECK (relevance IN ('obsolete', 'current', 'emerging'));

-- Set default value for existing rows
UPDATE skills SET relevance = 'current' WHERE relevance IS NULL;

-- Add index for filtering by relevance
CREATE INDEX IF NOT EXISTS idx_skills_relevance ON skills(relevance);
