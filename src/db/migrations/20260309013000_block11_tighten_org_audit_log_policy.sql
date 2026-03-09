DROP POLICY IF EXISTS "Org members can view org audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org owners and admins can view org audit logs" ON public.audit_logs;

CREATE POLICY "Org owners and admins can view org audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = audit_logs.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.status = 'active'
    )
  );
