-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251025222307
-- name: fix_duplicate_index
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Fix duplicate index on skills table
-- Drop the duplicate index, keeping the more descriptive one

DROP INDEX IF EXISTS public.idx_skills_profile;
