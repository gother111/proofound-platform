-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251031112251
-- name: fix_organizations_select_policy_recursion
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Fix potential recursion in organizations SELECT policy
-- The policy checks organization_members, which could cause issues

-- Drop existing policy
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Recreate using the helper function to break recursion
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    -- Use the helper function to check membership (bypasses RLS recursion)
    public.is_org_member(organizations.id, auth.uid())
  );
