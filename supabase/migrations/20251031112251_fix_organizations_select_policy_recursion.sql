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
