-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20260205153306
-- name: 20260205184500_add_missing_fk_indexes_followup
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- =========================================================================
-- Add Missing FK Indexes (Follow-up from Advisor)
-- Migration: 20260205_add_missing_fk_indexes_followup
-- Date: 2026-02-05
-- Purpose: Add indexes where FK columns are not the leading column
--          in existing composite indexes (per Supabase linter).
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_application_timeline_assignment_id
  ON public.application_timeline (assignment_id);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id
  ON public.blocked_users (blocked_id);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_submitted_by
  ON public.feedback_responses (submitted_by);
