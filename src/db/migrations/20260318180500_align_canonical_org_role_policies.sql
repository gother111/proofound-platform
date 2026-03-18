BEGIN;

UPDATE public.organization_members
SET role = public.normalize_org_role_compat(role)
WHERE role IN ('owner', 'admin', 'member', 'viewer');

UPDATE public.org_invitations
SET role = public.normalize_org_role_compat(role)
WHERE role IN ('owner', 'admin', 'member', 'viewer');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE role NOT IN ('org_owner', 'org_manager', 'org_reviewer')
  ) THEN
    RAISE EXCEPTION 'organization_members contains non-canonical roles after backfill';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.org_invitations
    WHERE role NOT IN ('org_owner', 'org_manager', 'org_reviewer')
  ) THEN
    RAISE EXCEPTION 'org_invitations contains non-canonical roles after backfill';
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

CREATE OR REPLACE FUNCTION public.normalize_org_role_compat(role_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE role_value
    WHEN 'owner' THEN 'org_owner'
    WHEN 'admin' THEN 'org_manager'
    WHEN 'member' THEN 'org_reviewer'
    WHEN 'viewer' THEN 'org_reviewer'
    ELSE role_value
  END;
$$;

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
      AND public.normalize_org_role_compat(om.role) = ANY (allowed_roles)
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
DROP POLICY IF EXISTS "Owners and managers can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org owners can update organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    public.has_active_org_membership(id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    public.has_org_role(id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and managers can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can delete members" ON public.organization_members;

CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    public.has_active_org_membership(org_id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
    OR (
      auth.uid() = user_id
      AND public.normalize_org_role_compat(role) = 'org_owner'
      AND EXISTS (
        SELECT 1
        FROM public.organizations
        WHERE organizations.id = organization_members.org_id
          AND organizations.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Org owners can update members"
  ON public.organization_members FOR UPDATE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can delete members"
  ON public.organization_members FOR DELETE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

DROP POLICY IF EXISTS "Org admins can view invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org admins can create invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org admins can delete invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org managers can view invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org managers can create invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org owners can create invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org owners can update invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org owners can delete invitations" ON public.org_invitations;

CREATE POLICY "Org managers can view invitations"
  ON public.org_invitations FOR SELECT
  USING (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can create invitations"
  ON public.org_invitations FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
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
DROP POLICY IF EXISTS "Org managers can view org audit logs" ON public.audit_logs;

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
DROP POLICY IF EXISTS "Org managers can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org managers can update assignments" ON public.assignments;

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

DO $$
BEGIN
  IF to_regclass('public.org_candidate_invites') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Org members can view candidate invites" ON public.org_candidate_invites;
    DROP POLICY IF EXISTS "Org admins can create candidate invites" ON public.org_candidate_invites;
    DROP POLICY IF EXISTS "Org admins can update candidate invites" ON public.org_candidate_invites;
    DROP POLICY IF EXISTS "Org managers can create candidate invites" ON public.org_candidate_invites;
    DROP POLICY IF EXISTS "Org managers can update candidate invites" ON public.org_candidate_invites;

    CREATE POLICY "Org members can view candidate invites"
      ON public.org_candidate_invites FOR SELECT
      USING (
        public.has_active_org_membership(org_id)
        OR public.is_trust_admin()
      );

    CREATE POLICY "Org managers can create candidate invites"
      ON public.org_candidate_invites FOR INSERT
      WITH CHECK (
        public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
        OR public.is_trust_admin()
      );

    CREATE POLICY "Org managers can update candidate invites"
      ON public.org_candidate_invites FOR UPDATE
      USING (
        public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
        OR public.is_trust_admin()
      )
      WITH CHECK (
        public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
        OR public.is_trust_admin()
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.assignment_creation_pipeline') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Stakeholders can update their pipeline steps" ON public.assignment_creation_pipeline;

    CREATE POLICY "Stakeholders can update their pipeline steps"
      ON public.assignment_creation_pipeline
      FOR UPDATE
      USING (
        auth.uid() = stakeholder_user_id
        OR EXISTS (
          SELECT 1
          FROM public.assignments a
          WHERE a.id = assignment_id
            AND (
              public.has_org_role(a.org_id, ARRAY['org_owner', 'org_manager'])
              OR public.is_trust_admin()
            )
        )
      )
      WITH CHECK (
        auth.uid() = stakeholder_user_id
        OR EXISTS (
          SELECT 1
          FROM public.assignments a
          WHERE a.id = assignment_id
            AND (
              public.has_org_role(a.org_id, ARRAY['org_owner', 'org_manager'])
              OR public.is_trust_admin()
            )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.assignment_field_visibility') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Org members can manage field visibility" ON public.assignment_field_visibility;

    CREATE POLICY "Org members can manage field visibility"
      ON public.assignment_field_visibility
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM public.assignments a
          WHERE a.id = assignment_id
            AND (
              public.has_org_role(a.org_id, ARRAY['org_owner', 'org_manager', 'org_reviewer'])
              OR public.is_trust_admin()
            )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.assignments a
          WHERE a.id = assignment_id
            AND (
              public.has_org_role(a.org_id, ARRAY['org_owner', 'org_manager', 'org_reviewer'])
              OR public.is_trust_admin()
            )
        )
      );
  END IF;
END $$;

COMMIT;
