-- Final fix for infinite recursion in organization_members RLS policies
-- This prevents individual users from being blocked when accessing verification settings

-- Drop and recreate the function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.is_org_member(UUID, UUID) CASCADE;

-- Create the function with a cleaner implementation
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- SECURITY DEFINER makes this function run with owner's privileges
  -- This bypasses RLS and prevents recursive policy evaluation
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND status = 'active'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO anon;

-- Recreate the organization_members SELECT policy (was dropped by CASCADE)
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;

CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    -- Allow users to see their own membership records (no recursion)
    user_id = auth.uid()
    -- OR allow users to see members of orgs they belong to (using function)
    OR public.is_org_member(org_id, auth.uid())
  );

-- Recreate the organizations SELECT policy (was dropped by CASCADE)
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    -- Use the helper function to check membership (bypasses RLS recursion)
    public.is_org_member(id, auth.uid())
  );

-- Add comment explaining the fix
COMMENT ON FUNCTION public.is_org_member(UUID, UUID) IS 
  'SECURITY DEFINER function to check org membership without triggering RLS recursion. Used by RLS policies on organization_members and organizations tables.';

