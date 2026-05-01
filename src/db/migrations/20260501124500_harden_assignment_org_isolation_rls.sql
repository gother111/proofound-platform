BEGIN;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authenticated_read_published_assignments ON public.assignments;
DROP POLICY IF EXISTS org_members_read_org_assignments ON public.assignments;
DROP POLICY IF EXISTS org_members_create_assignments ON public.assignments;
DROP POLICY IF EXISTS org_members_update_assignments ON public.assignments;
DROP POLICY IF EXISTS "Users can view assignments for their organizations" ON public.assignments;
DROP POLICY IF EXISTS "Organization members can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Organization admins can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org members can view org assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org admins can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org admins can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org managers can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org managers can update assignments" ON public.assignments;

CREATE POLICY "Org members can view org assignments"
  ON public.assignments
  FOR SELECT
  TO authenticated
  USING (
    public.has_active_org_membership(org_id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Org managers can create assignments"
  ON public.assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org managers can update assignments"
  ON public.assignments
  FOR UPDATE
  TO authenticated
  USING (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

COMMIT;
