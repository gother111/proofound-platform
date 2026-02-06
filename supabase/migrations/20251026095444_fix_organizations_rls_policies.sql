-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251026095444
-- name: fix_organizations_rls_policies
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Fix organizations RLS policies to use (select auth.uid()) for better performance

-- Drop existing policies
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Members can view their organizations
CREATE POLICY "Members can view their organizations" ON organizations
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_members.org_id = organizations.id
      AND organization_members.user_id = (SELECT auth.uid())
      AND organization_members.status = 'active'
  )
);

-- Owners and admins can update organizations
CREATE POLICY "Owners and admins can update organizations" ON organizations
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_members.org_id = organizations.id
      AND organization_members.user_id = (SELECT auth.uid())
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_members.org_id = organizations.id
      AND organization_members.user_id = (SELECT auth.uid())
      AND organization_members.role IN ('owner', 'admin')
      AND organization_members.status = 'active'
  )
);

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
FOR INSERT
TO public
WITH CHECK (
  (SELECT auth.uid()) = created_by
);
