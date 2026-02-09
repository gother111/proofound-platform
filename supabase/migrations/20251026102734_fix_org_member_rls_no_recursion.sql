-- Drop all existing organization_members policies
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "View own memberships" ON organization_members;
DROP POLICY IF EXISTS "Self insert owner membership" ON organization_members;
DROP POLICY IF EXISTS "Manage own membership" ON organization_members;
DROP POLICY IF EXISTS "Delete own membership" ON organization_members;

-- Simple, non-recursive policies that prevent infinite recursion
-- Users can only view their own memberships
CREATE POLICY "Users can view own memberships"
ON organization_members FOR SELECT
TO public
USING (user_id = (SELECT auth.uid()));

-- Users can insert their own owner membership during onboarding
CREATE POLICY "Users can insert own owner membership"
ON organization_members FOR INSERT
TO public
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND role = 'owner'
  AND status = 'active'
);

-- Users can update their own membership
CREATE POLICY "Users can update own membership"
ON organization_members FOR UPDATE
TO public
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own membership
CREATE POLICY "Users can delete own membership"
ON organization_members FOR DELETE
TO public
USING (user_id = (SELECT auth.uid()));
