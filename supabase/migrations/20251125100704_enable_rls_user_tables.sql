-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251125100704
-- name: enable_rls_user_tables
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- ============================================
-- ENABLE RLS ON USER-FACING TABLES
-- ============================================
-- Migration: 20251125_enable_rls_user_tables
-- Date: 2025-11-25
-- Purpose: Enable RLS and add policies for user-facing tables
-- Reference: PRD Part 8 - Security & Privacy Requirements
-- ============================================

-- ============================================
-- HELPER FUNCTION: is_org_member (with search_path fix)
-- ============================================

-- Recreate is_org_member with proper search_path
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  -- SECURITY DEFINER makes this function run with owner's privileges
  -- This bypasses RLS and prevents recursive policy evaluation
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$function$;

COMMENT ON FUNCTION is_org_member IS 'Check if user is an active member of an organization. SECURITY DEFINER to avoid RLS recursion.';

-- ============================================
-- HELPER FUNCTION: is_platform_admin
-- ============================================

CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles
    WHERE id = p_user_id
      AND platform_role IN ('platform_admin', 'super_admin')
  );
END;
$function$;

COMMENT ON FUNCTION is_platform_admin IS 'Check if user is a platform admin. SECURITY DEFINER to avoid RLS recursion.';

-- ============================================
-- TABLE 1: contracts
-- ============================================

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Users can read contracts they're party to
CREATE POLICY "contracts_user_read"
  ON contracts FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_org_member(org_id, auth.uid())
    OR is_platform_admin()
  );

-- Users can create contracts (individual side)
CREATE POLICY "contracts_user_insert"
  ON contracts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR is_org_member(org_id, auth.uid())
  );

-- Users can update contracts they're party to
CREATE POLICY "contracts_user_update"
  ON contracts FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_org_member(org_id, auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    OR is_org_member(org_id, auth.uid())
  );

-- Users can delete contracts they created
CREATE POLICY "contracts_user_delete"
  ON contracts FOR DELETE
  USING (
    auth.uid() = user_id
    OR is_org_member(org_id, auth.uid())
  );

-- ============================================
-- TABLE 2: interviews
-- ============================================

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Users can read interviews they host or participate in
CREATE POLICY "interviews_participant_read"
  ON interviews FOR SELECT
  USING (
    auth.uid() = host_user_id
    OR auth.uid() = ANY(participant_user_ids)
    OR EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN assignments a ON m.assignment_id = a.id
      WHERE m.id = interviews.match_id
        AND is_org_member(a.org_id, auth.uid())
    )
    OR is_platform_admin()
  );

-- Org members can create interviews for their assignments
CREATE POLICY "interviews_org_insert"
  ON interviews FOR INSERT
  WITH CHECK (
    auth.uid() = host_user_id
    OR EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN assignments a ON m.assignment_id = a.id
      WHERE m.id = match_id
        AND is_org_member(a.org_id, auth.uid())
    )
  );

-- Host can update interviews
CREATE POLICY "interviews_host_update"
  ON interviews FOR UPDATE
  USING (
    auth.uid() = host_user_id
    OR EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN assignments a ON m.assignment_id = a.id
      WHERE m.id = interviews.match_id
        AND is_org_member(a.org_id, auth.uid())
    )
  );

-- Host can delete interviews
CREATE POLICY "interviews_host_delete"
  ON interviews FOR DELETE
  USING (
    auth.uid() = host_user_id
    OR EXISTS (
      SELECT 1 FROM matches m
      INNER JOIN assignments a ON m.assignment_id = a.id
      WHERE m.id = interviews.match_id
        AND is_org_member(a.org_id, auth.uid())
    )
  );

-- ============================================
-- TABLE 3: wellbeing_checkins (PRIVATE - owner only)
-- ============================================

ALTER TABLE wellbeing_checkins ENABLE ROW LEVEL SECURITY;

-- ONLY owner can read their own check-ins (privacy-first, per PRD)
CREATE POLICY "wellbeing_checkins_owner_read"
  ON wellbeing_checkins FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can create check-ins
CREATE POLICY "wellbeing_checkins_owner_insert"
  ON wellbeing_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their check-ins
CREATE POLICY "wellbeing_checkins_owner_update"
  ON wellbeing_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their check-ins
CREATE POLICY "wellbeing_checkins_owner_delete"
  ON wellbeing_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 4: wellbeing_opt_ins (PRIVATE - owner only)
-- ============================================

ALTER TABLE wellbeing_opt_ins ENABLE ROW LEVEL SECURITY;

-- ONLY owner can read their consent
CREATE POLICY "wellbeing_opt_ins_owner_read"
  ON wellbeing_opt_ins FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can create opt-in record
CREATE POLICY "wellbeing_opt_ins_owner_insert"
  ON wellbeing_opt_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their opt-in
CREATE POLICY "wellbeing_opt_ins_owner_update"
  ON wellbeing_opt_ins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their opt-in
CREATE POLICY "wellbeing_opt_ins_owner_delete"
  ON wellbeing_opt_ins FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 5: wellbeing_reflections (PRIVATE - owner only)
-- ============================================

ALTER TABLE wellbeing_reflections ENABLE ROW LEVEL SECURITY;

-- ONLY owner can read their reflections
CREATE POLICY "wellbeing_reflections_owner_read"
  ON wellbeing_reflections FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can create reflections
CREATE POLICY "wellbeing_reflections_owner_insert"
  ON wellbeing_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their reflections
CREATE POLICY "wellbeing_reflections_owner_update"
  ON wellbeing_reflections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their reflections
CREATE POLICY "wellbeing_reflections_owner_delete"
  ON wellbeing_reflections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 6: self_assessments (PRIVATE - owner only)
-- ============================================

ALTER TABLE self_assessments ENABLE ROW LEVEL SECURITY;

-- ONLY owner can read their assessments
CREATE POLICY "self_assessments_owner_read"
  ON self_assessments FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can create assessments
CREATE POLICY "self_assessments_owner_insert"
  ON self_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their assessments
CREATE POLICY "self_assessments_owner_update"
  ON self_assessments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their assessments
CREATE POLICY "self_assessments_owner_delete"
  ON self_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 7: work_schedules (PRIVATE - owner only)
-- ============================================

ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

-- ONLY owner can read their schedule
CREATE POLICY "work_schedules_owner_read"
  ON work_schedules FOR SELECT
  USING (auth.uid() = user_id);

-- Owner can create their schedule
CREATE POLICY "work_schedules_owner_insert"
  ON work_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can update their schedule
CREATE POLICY "work_schedules_owner_update"
  ON work_schedules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owner can delete their schedule
CREATE POLICY "work_schedules_owner_delete"
  ON work_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE 8: organization_field_visibility
-- ============================================

ALTER TABLE organization_field_visibility ENABLE ROW LEVEL SECURITY;

-- Org members can read visibility settings
CREATE POLICY "org_field_visibility_read"
  ON organization_field_visibility FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

-- Org members can create visibility settings
CREATE POLICY "org_field_visibility_insert"
  ON organization_field_visibility FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

-- Org members can update visibility settings
CREATE POLICY "org_field_visibility_update"
  ON organization_field_visibility FOR UPDATE
  USING (is_org_member(org_id, auth.uid()))
  WITH CHECK (is_org_member(org_id, auth.uid()));

-- Org members can delete visibility settings
CREATE POLICY "org_field_visibility_delete"
  ON organization_field_visibility FOR DELETE
  USING (is_org_member(org_id, auth.uid()));

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON interviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wellbeing_checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wellbeing_opt_ins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wellbeing_reflections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON self_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON work_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_field_visibility TO authenticated;

GRANT ALL ON contracts TO service_role;
GRANT ALL ON interviews TO service_role;
GRANT ALL ON wellbeing_checkins TO service_role;
GRANT ALL ON wellbeing_opt_ins TO service_role;
GRANT ALL ON wellbeing_reflections TO service_role;
GRANT ALL ON self_assessments TO service_role;
GRANT ALL ON work_schedules TO service_role;
GRANT ALL ON organization_field_visibility TO service_role;
