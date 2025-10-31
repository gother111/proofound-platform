-- Remove duplicate and recursive RLS policies on organization_members
-- These policies are causing infinite recursion when individual users try to access verification settings

-- Remove the duplicate recursive SELECT policy
-- This policy queries organization_members within its own check, causing recursion
DROP POLICY IF EXISTS "org_members_read_members" ON public.organization_members;

-- Remove the recursive ALL policy
-- This policy also has a recursive EXISTS check and conflicts with specific operation policies
DROP POLICY IF EXISTS "org_admins_manage_members" ON public.organization_members;

-- After this migration, only non-recursive policies should remain on organization_members:
-- 1. "Members can view organization members" (SELECT, uses is_org_member function - non-recursive)
-- 2. "Users can insert own owner membership" (INSERT)
-- 3. "Users can update own membership" (UPDATE)
-- 4. "Users can delete own membership" (DELETE)

-- Add comment to explain the fix
COMMENT ON TABLE public.organization_members IS 
  'RLS policies use is_org_member() SECURITY DEFINER function to avoid infinite recursion. Direct EXISTS checks on organization_members within policies can cause recursion.';

