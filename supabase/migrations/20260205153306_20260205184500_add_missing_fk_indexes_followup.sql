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
