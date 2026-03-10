BEGIN;

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inactive_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ownership_transfer_initiated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ownership_transfer_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ownership_transfer_from_membership_id UUID,
  ADD COLUMN IF NOT EXISTS ownership_transfer_target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS status TEXT;

UPDATE public.organization_members
SET state = CASE COALESCE(state, status, 'active')
  WHEN 'owner' THEN 'active'
  WHEN 'admin' THEN 'active'
  WHEN 'member' THEN 'active'
  WHEN 'viewer' THEN 'active'
  WHEN 'invited' THEN 'invited_pending'
  WHEN 'pending' THEN 'invited_pending'
  WHEN 'active' THEN 'active'
  WHEN 'inactive' THEN 'inactive'
  WHEN 'ownership_transfer_pending' THEN 'ownership_transfer_pending'
  WHEN 'suspended' THEN 'suspended'
  WHEN 'removed' THEN 'removed'
  WHEN 'declined' THEN 'declined'
  WHEN 'expired' THEN 'expired'
  WHEN 'revoked' THEN 'revoked'
  ELSE 'active'
END
WHERE state IS NULL
   OR state NOT IN (
     'invited_pending',
     'active',
     'inactive',
     'ownership_transfer_pending',
     'suspended',
     'removed',
     'declined',
     'expired',
     'revoked'
   );

UPDATE public.organization_members
SET role = CASE role
  WHEN 'owner' THEN 'org_owner'
  WHEN 'admin' THEN 'org_manager'
  WHEN 'member' THEN 'org_reviewer'
  WHEN 'viewer' THEN 'org_reviewer'
  ELSE role
END;

UPDATE public.organization_members
SET status = state,
    accepted_at = COALESCE(accepted_at, CASE WHEN state = 'active' THEN joined_at ELSE accepted_at END),
    suspended_at = COALESCE(suspended_at, CASE WHEN state = 'suspended' THEN updated_at ELSE suspended_at END),
    removed_at = COALESCE(removed_at, CASE WHEN state = 'removed' THEN updated_at ELSE removed_at END),
    declined_at = COALESCE(declined_at, CASE WHEN state = 'declined' THEN updated_at ELSE declined_at END),
    expired_at = COALESCE(expired_at, CASE WHEN state = 'expired' THEN updated_at ELSE expired_at END),
    revoked_at = COALESCE(revoked_at, CASE WHEN state = 'revoked' THEN updated_at ELSE revoked_at END),
    created_at = COALESCE(created_at, joined_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

ALTER TABLE public.organization_members
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN state SET DEFAULT 'invited_pending',
  ALTER COLUMN state SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'invited_pending',
  ALTER COLUMN status SET NOT NULL;

DO $$
DECLARE
  existing_pk TEXT;
BEGIN
  SELECT conname
  INTO existing_pk
  FROM pg_constraint
  WHERE conrelid = 'public.organization_members'::regclass
    AND contype = 'p'
  LIMIT 1;

  IF existing_pk IS NOT NULL AND existing_pk <> 'organization_members_pkey' THEN
    EXECUTE format('ALTER TABLE public.organization_members DROP CONSTRAINT %I', existing_pk);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.organization_members'::regclass
      AND conname = 'organization_members_pkey'
  ) THEN
    ALTER TABLE public.organization_members
      ADD CONSTRAINT organization_members_pkey PRIMARY KEY (id);
  END IF;
END $$;

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check,
  DROP CONSTRAINT IF EXISTS organization_members_state_ck,
  DROP CONSTRAINT IF EXISTS organization_members_status_ck;

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('org_owner', 'org_manager', 'org_reviewer', 'individual', 'trust_admin')),
  ADD CONSTRAINT organization_members_state_ck
  CHECK (state IN ('invited_pending', 'active', 'inactive', 'ownership_transfer_pending', 'suspended', 'removed', 'declined', 'expired', 'revoked')),
  ADD CONSTRAINT organization_members_status_ck
  CHECK (status IN ('invited_pending', 'active', 'inactive', 'ownership_transfer_pending', 'suspended', 'removed', 'declined', 'expired', 'revoked'));

CREATE UNIQUE INDEX IF NOT EXISTS organization_members_org_user_unique_idx
  ON public.organization_members(org_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS organization_members_id_unique_idx
  ON public.organization_members(id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_user
  ON public.organization_members(org_id, user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_state
  ON public.organization_members(org_id, state);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_state
  ON public.organization_members(user_id, state);

CREATE OR REPLACE FUNCTION public.sync_organization_member_status_state()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.state IS NULL AND NEW.status IS NOT NULL THEN
    NEW.state := NEW.status;
  END IF;

  IF NEW.status IS NULL AND NEW.state IS NOT NULL THEN
    NEW.status := NEW.state;
  END IF;

  NEW.status := NEW.state;
  NEW.updated_at := COALESCE(NEW.updated_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_organization_member_status_state ON public.organization_members;
CREATE TRIGGER set_organization_member_status_state
BEFORE INSERT OR UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_organization_member_status_state();

ALTER TABLE public.org_invitations
  ADD COLUMN IF NOT EXISTS membership_id UUID REFERENCES public.organization_members(id) ON DELETE SET NULL;

UPDATE public.org_invitations
SET role = CASE role
  WHEN 'admin' THEN 'org_manager'
  WHEN 'member' THEN 'org_reviewer'
  WHEN 'viewer' THEN 'org_reviewer'
  ELSE role
END;

ALTER TABLE public.org_invitations
  DROP CONSTRAINT IF EXISTS org_invitations_role_check;

ALTER TABLE public.org_invitations
  ADD CONSTRAINT org_invitations_role_check
  CHECK (role IN ('org_owner', 'org_manager', 'org_reviewer', 'individual', 'trust_admin'));

CREATE OR REPLACE FUNCTION public.has_active_org_membership(target_org_id UUID, actor_id UUID DEFAULT auth.uid())
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

CREATE OR REPLACE FUNCTION public.is_trust_admin(actor_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = actor_id
      AND p.platform_role IN ('platform_admin', 'super_admin')
  );
$$;

DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    public.has_active_org_membership(id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Owners and managers can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    public.has_org_role(id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON public.organization_members;

CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    public.has_active_org_membership(org_id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Owners and managers can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
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

CREATE POLICY "Owners can update members"
  ON public.organization_members FOR UPDATE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Owners can delete members"
  ON public.organization_members FOR DELETE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

DROP POLICY IF EXISTS "Org admins can view invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org admins can create invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org admins can delete invitations" ON public.org_invitations;

CREATE POLICY "Org managers can view invitations"
  ON public.org_invitations FOR SELECT
  USING (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org managers can create invitations"
  ON public.org_invitations FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can update invitations"
  ON public.org_invitations FOR UPDATE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can delete invitations"
  ON public.org_invitations FOR DELETE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

DROP POLICY IF EXISTS "Org members can view org audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org owners and admins can view org audit logs" ON public.audit_logs;

CREATE POLICY "Org managers can view org audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    actor_id = auth.uid()
    OR (
      org_id IS NOT NULL
      AND public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    )
    OR public.is_trust_admin()
  );

DROP POLICY IF EXISTS "Org members can view org assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org admins can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org admins can update assignments" ON public.assignments;

CREATE POLICY "Org members can view org assignments"
  ON public.assignments FOR SELECT
  USING (
    public.has_active_org_membership(org_id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Org managers can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org managers can update assignments"
  ON public.assignments FOR UPDATE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

COMMIT;
