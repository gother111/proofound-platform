-- Fix infinite recursion by using a SECURITY DEFINER function that explicitly disables RLS
-- This function will bypass RLS entirely when checking membership

-- Drop existing policy
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS public.is_org_member(UUID, UUID);

-- Create a function that explicitly disables RLS
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Explicitly disable RLS for this function's queries
  SET LOCAL row_security = off;
  
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND status = 'active'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Recreate the policy using the helper function
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    -- Allow users to see their own membership records (no recursion)
    user_id = auth.uid()
    -- OR allow users to see members of orgs they belong to (using function that bypasses RLS)
    OR public.is_org_member(org_id, auth.uid())
  );

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated;
