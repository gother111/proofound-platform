-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251026102217
-- name: restore_org_member_policies
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Restore organization_members policies from known working version
DROP POLICY IF EXISTS "View own memberships" ON organization_members;
DROP POLICY IF EXISTS "Self insert owner membership" ON organization_members;
DROP POLICY IF EXISTS "Manage own membership" ON organization_members;
DROP POLICY IF EXISTS "Delete own membership" ON organization_members;

DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON organization_members;

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
  OR organization_members.user_id = (SELECT auth.uid())
);

CREATE POLICY "Owners and admins can insert members" ON organization_members
FOR INSERT
TO public
WITH CHECK (
  -- Existing owners/admins adding other members
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
  )
  -- User inserting their own membership as owner
  OR (
    organization_members.user_id = (SELECT auth.uid())
    AND organization_members.role = 'owner'
  )
);

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
  OR organization_members.user_id = (SELECT auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
  )
  OR organization_members.user_id = (SELECT auth.uid())
);

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
  OR organization_members.user_id = (SELECT auth.uid())
);
