-- Remove duplicate policies that are causing recursion
-- There are multiple SELECT policies and one still uses the old recursive EXISTS check

-- Remove old organization_members policy
DROP POLICY IF EXISTS "Users can view own memberships" ON public.organization_members;

-- Remove old organizations policy that still uses recursive EXISTS
DROP POLICY IF EXISTS "Members and creators can view organizations" ON public.organizations;

-- Verify: organization_members should only have "Members can view organization members"
-- Verify: organizations should only have "Members can view their organizations";
