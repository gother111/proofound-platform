-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251026095007
-- name: fix_org_member_insert_policy
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Fix organization_members insert policy to use (select auth.uid()) for better performance
-- This allows users to insert themselves as owners when they create an organization

DROP POLICY IF EXISTS "Owners and admins can insert members" ON organization_members;

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
