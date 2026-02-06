-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251026095454
-- name: fix_organization_members_all_rls_policies
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Fix all organization_members RLS policies to use (select auth.uid())

-- Drop all existing policies
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON organization_members;

-- Members can view organization members
CREATE POLICY "Members can view organization members" ON organization_members
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.status = 'active'
  )
);

-- Owners and admins can insert members
CREATE POLICY "Owners and admins can insert members" ON organization_members
FOR INSERT
TO public
WITH CHECK (
  -- Existing members who are owners/admins can add new members
  (EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
  ))
  -- Or the user is creating their own membership as owner and creating the organization
  OR (
    (SELECT auth.uid()) = user_id
    AND role = 'owner'
    AND EXISTS (
      SELECT 1
      FROM organizations
      WHERE organizations.id = organization_members.org_id
        AND organizations.created_by = (SELECT auth.uid())
    )
  )
  -- Or user is inserting themselves
  OR ((SELECT auth.uid()) = user_id)
);

-- Owners and admins can update members
CREATE POLICY "Owners and admins can update members" ON organization_members
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
  )
);

-- Owners and admins can delete members
CREATE POLICY "Owners and admins can delete members" ON organization_members
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
  )
);
