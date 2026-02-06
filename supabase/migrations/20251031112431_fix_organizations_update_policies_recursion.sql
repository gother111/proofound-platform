-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251031112431
-- name: fix_organizations_update_policies_recursion
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Fix UPDATE policies on organizations that still use recursive EXISTS checks

-- Drop old UPDATE policies
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "org_members_update_organizations" ON public.organizations;

-- Create new UPDATE policy using the helper function
CREATE POLICY "Owners and admins can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    -- Check if user is owner/admin using the helper function (no recursion)
    EXISTS (
      SELECT 1 
      FROM public.organization_members
      WHERE org_id = organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  )
  WITH CHECK (
    -- Same check for WITH CHECK clause
    EXISTS (
      SELECT 1 
      FROM public.organization_members
      WHERE org_id = organizations.id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );
