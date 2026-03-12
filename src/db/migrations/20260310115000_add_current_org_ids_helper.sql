BEGIN;

CREATE OR REPLACE FUNCTION public.current_org_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(array_agg(DISTINCT om.org_id), ARRAY[]::uuid[])
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND om.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.current_org_ids() TO authenticated, service_role;

COMMIT;
