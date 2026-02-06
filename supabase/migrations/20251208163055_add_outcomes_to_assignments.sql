-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251208163055
-- name: add_outcomes_to_assignments
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
alter table assignments add column if not exists outcomes jsonb default '[]'::jsonb;
