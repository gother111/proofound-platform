BEGIN;

UPDATE public.organization_members
SET role = CASE role
  WHEN 'owner' THEN 'org_owner'
  WHEN 'admin' THEN 'org_manager'
  WHEN 'member' THEN 'org_reviewer'
  WHEN 'viewer' THEN 'org_reviewer'
  ELSE role
END
WHERE role IN ('owner', 'admin', 'member', 'viewer');

UPDATE public.org_invitations
SET role = CASE role
  WHEN 'owner' THEN 'org_owner'
  WHEN 'admin' THEN 'org_manager'
  WHEN 'member' THEN 'org_reviewer'
  WHEN 'viewer' THEN 'org_reviewer'
  ELSE role
END
WHERE role IN ('owner', 'admin', 'member', 'viewer');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE role NOT IN ('org_owner', 'org_manager', 'org_reviewer')
  ) THEN
    RAISE EXCEPTION 'organization_members contains non-canonical roles after canonical backfill';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.org_invitations
    WHERE role NOT IN ('org_owner', 'org_manager', 'org_reviewer')
  ) THEN
    RAISE EXCEPTION 'org_invitations contains non-canonical roles after canonical backfill';
  END IF;
END $$;

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('org_owner', 'org_manager', 'org_reviewer'));

ALTER TABLE public.org_invitations
  DROP CONSTRAINT IF EXISTS org_invitations_role_check;

ALTER TABLE public.org_invitations
  ADD CONSTRAINT org_invitations_role_check
  CHECK (role IN ('org_owner', 'org_manager', 'org_reviewer'));

DROP POLICY IF EXISTS "Org owners can insert members" ON public.organization_members;

CREATE OR REPLACE FUNCTION public.has_active_org_membership(
  target_org_id UUID,
  actor_id UUID DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.org_id = target_org_id
      AND om.user_id = actor_id
      AND om.state = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(
  target_org_id UUID,
  allowed_roles TEXT[],
  actor_id UUID DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.org_id = target_org_id
      AND om.user_id = actor_id
      AND om.state = 'active'
      AND om.role = ANY (allowed_roles)
  );
$$;

CREATE POLICY "Org owners can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
    OR (
      auth.uid() = user_id
      AND role = 'org_owner'
      AND EXISTS (
        SELECT 1
        FROM public.organizations
        WHERE organizations.id = organization_members.org_id
          AND organizations.created_by = auth.uid()
      )
    )
  );

DROP FUNCTION IF EXISTS public.normalize_org_role_compat(TEXT);

COMMIT;
