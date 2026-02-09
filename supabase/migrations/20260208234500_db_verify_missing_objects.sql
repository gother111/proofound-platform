-- ============================================================================
-- DB Verify Missing Objects + Security Fixes
-- Migration: 20260208234500_db_verify_missing_objects
-- Date: 2026-02-08
--
-- Purpose:
-- - Add compatibility views used by the app (`skills_l1_categories`, `l4_skills`, `matching_results`)
-- - Add missing table used by the app (`attestations`)
-- - Add missing RPC used by the admin UI (`get_moderation_stats`)
-- - Fix critical privilege escalation: prevent anon/authenticated from writing profiles.platform_role
-- ============================================================================

-- Extensions used across the codebase (safe if already enabled).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1) Attestations (peer trust signal)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attester_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attestations_subject_status
  ON public.attestations(subject_user_id, status);

ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;

-- Users can read attestations they received or wrote. Platform admins can read all.
CREATE POLICY "attestations_read"
  ON public.attestations
  FOR SELECT
  USING (
    auth.uid() = subject_user_id
    OR auth.uid() = attester_user_id
    OR is_platform_admin()
  );

-- Allow authenticated users to create attestations as the attester.
CREATE POLICY "attestations_insert"
  ON public.attestations
  FOR INSERT
  WITH CHECK (auth.uid() = attester_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attestations TO authenticated;

-- ============================================================================
-- 2) Compatibility Views
-- ============================================================================

-- skills_l1_categories: used by /api/expertise/gap-analysis
CREATE OR REPLACE VIEW public.skills_l1_categories AS
SELECT
  cat_id AS id,
  COALESCE(name_i18n->>'en', name_i18n->>'default', slug) AS name
FROM public.skills_categories;

GRANT SELECT ON public.skills_l1_categories TO authenticated;

-- l4_skills: used by /api/match/explain/[matchId] to label skill codes
CREATE OR REPLACE VIEW public.l4_skills AS
SELECT
  code,
  COALESCE(name_i18n->>'en', name_i18n->>'default', code) AS name
FROM public.skills_taxonomy
WHERE status = 'active';

GRANT SELECT ON public.l4_skills TO authenticated;

-- matching_results: used by privacy redaction logic (match_only visibility)
-- Note: RLS is enforced on the underlying tables (matches, assignments).
CREATE OR REPLACE VIEW public.matching_results AS
SELECT
  m.id,
  m.profile_id,
  m.assignment_id,
  a.org_id,
  CASE
    WHEN a.status = 'active' AND (m.snoozed_until IS NULL OR m.snoozed_until < now()) THEN 'active'
    WHEN a.status = 'paused' THEN 'paused'
    WHEN a.status = 'closed' THEN 'closed'
    WHEN a.status = 'draft' THEN 'draft'
    ELSE a.status
  END AS status
FROM public.matches m
INNER JOIN public.assignments a ON a.id = m.assignment_id;

GRANT SELECT ON public.matching_results TO authenticated;

-- ============================================================================
-- 3) RPC: get_moderation_stats (admin UI)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_moderation_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public, pg_catalog
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'pending', (SELECT COUNT(*) FROM public.content_reports WHERE status = 'pending'),
    'in_review', (SELECT COUNT(*) FROM public.content_reports WHERE status = 'in_review'),
    'resolved', (SELECT COUNT(*) FROM public.content_reports WHERE status = 'resolved'),
    'dismissed', (SELECT COUNT(*) FROM public.content_reports WHERE status = 'dismissed'),
    'critical', (SELECT COUNT(*) FROM public.content_reports WHERE priority = 'critical'),
    'high', (SELECT COUNT(*) FROM public.content_reports WHERE priority = 'high'),
    'medium', (SELECT COUNT(*) FROM public.content_reports WHERE priority = 'medium'),
    'low', (SELECT COUNT(*) FROM public.content_reports WHERE priority = 'low')
  ) INTO result;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_moderation_stats() TO authenticated;

-- ============================================================================
-- 4) Security: prevent platform role escalation
-- ============================================================================

REVOKE UPDATE (platform_role) ON public.profiles FROM anon, authenticated;
REVOKE INSERT (platform_role) ON public.profiles FROM anon, authenticated;
