-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251026090543
-- name: fix_org_member_policy
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Fix organization_members INSERT policy to allow org creators to add themselves as first owner
-- This fixes the chicken-and-egg problem where the first owner can't be inserted

DROP POLICY IF EXISTS "Owners and admins can insert members" ON public.organization_members;

CREATE POLICY "Owners and admins can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    -- Allow existing owners/admins to add members
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
    )
    -- Allow org creator to add first owner (themselves)
    OR (
      auth.uid() = user_id 
      AND role = 'owner'
      AND EXISTS (
        SELECT 1 FROM public.organizations
        WHERE organizations.id = organization_members.org_id
          AND organizations.created_by = auth.uid()
      )
    )
    -- Allow self-join via invitation
    OR auth.uid() = user_id
  );
