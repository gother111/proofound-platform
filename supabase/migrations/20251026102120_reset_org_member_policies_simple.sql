-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251026102120
-- name: reset_org_member_policies_simple
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Replace organization_members policies with simplified, non-recursive versions
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON organization_members;

-- Allow users to view their own memberships (sufficient for onboarding checks)
CREATE POLICY "View own memberships" ON organization_members
FOR SELECT
TO public
USING (organization_members.user_id = (SELECT auth.uid()));

-- Allow users to create their own owner membership during onboarding
CREATE POLICY "Self insert owner membership" ON organization_members
FOR INSERT
TO public
WITH CHECK (
  organization_members.user_id = (SELECT auth.uid())
  AND organization_members.role = 'owner'
);

-- Allow users to update or delete their own membership records
CREATE POLICY "Manage own membership" ON organization_members
FOR UPDATE
TO public
USING (organization_members.user_id = (SELECT auth.uid()))
WITH CHECK (organization_members.user_id = (SELECT auth.uid()));

CREATE POLICY "Delete own membership" ON organization_members
FOR DELETE
TO public
USING (organization_members.user_id = (SELECT auth.uid()));
