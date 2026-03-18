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
    RAISE EXCEPTION
      'organization_members contains non-canonical roles outside the launch role model';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.org_invitations
    WHERE role NOT IN ('org_owner', 'org_manager', 'org_reviewer')
  ) THEN
    RAISE EXCEPTION
      'org_invitations contains non-canonical roles outside the launch role model';
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

COMMIT;
