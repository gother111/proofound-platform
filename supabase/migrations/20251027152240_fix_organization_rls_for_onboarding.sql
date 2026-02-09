-- Allow creators to immediately SELECT their organization after INSERT
-- This fixes the chicken-and-egg problem during onboarding

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Create new SELECT policy that allows both:
-- 1. Members to view their organizations (existing behavior)
-- 2. Creators to view organizations they just created (new behavior for onboarding)
CREATE POLICY "Members and creators can view organizations"
ON public.organizations
FOR SELECT
TO public
USING (
  -- User is a member of the organization
  EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_members.org_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.status = 'active'
  )
  OR
  -- User is the creator (allows immediate SELECT after INSERT during onboarding)
  created_by = auth.uid()
);
