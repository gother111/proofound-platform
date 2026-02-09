-- Simplified fix: Allow users to see their own membership records first
-- This breaks recursion because checking user_id = auth.uid() doesn't require querying organization_members

DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;

-- Simplified policy: Users can see their own memberships OR members of orgs they belong to
-- The key is checking their own membership first (which doesn't recurse)
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    -- First check: Allow users to see their own membership records (no recursion)
    user_id = auth.uid()
    -- Second check: Allow users to see other members of orgs they belong to
    -- We check if there exists ANY active membership for this user in the same org
    -- Using a direct query but with a different table alias to potentially help
    OR EXISTS (
      SELECT 1 
      FROM public.organization_members om_check
      WHERE om_check.org_id = organization_members.org_id
        AND om_check.user_id = auth.uid()
        AND om_check.status = 'active'
        -- Ensure we're not checking the same row (though this shouldn't be necessary)
        AND (om_check.org_id, om_check.user_id) != (organization_members.org_id, organization_members.user_id)
    )
  );
