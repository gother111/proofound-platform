-- Update remaining organization_members policies to use (SELECT auth.uid()) consistently
DROP POLICY IF EXISTS "Members can view organization members" ON organization_members;
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
);
