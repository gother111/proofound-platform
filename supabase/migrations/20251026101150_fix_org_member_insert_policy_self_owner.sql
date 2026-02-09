-- Simplify organization_members insert policy to allow self-ownership without joining organizations
DROP POLICY IF EXISTS "Owners and admins can insert members" ON organization_members;

CREATE POLICY "Owners and admins can insert members" ON organization_members
FOR INSERT
TO public
WITH CHECK (
  -- Existing owners/admins adding members
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
      AND om.status = 'active'
  )
  -- User inserting themselves as owner (no org membership yet)
  OR (
    (SELECT auth.uid()) = organization_members.user_id
    AND organization_members.role = 'owner'
  )
);
