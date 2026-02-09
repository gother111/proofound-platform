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
