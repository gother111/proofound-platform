BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.app_migration_ledger
    WHERE version IN (
      '20260318180500_align_canonical_org_role_policies',
      '20260320113000_finalize_canonical_org_roles',
      '20260320143000_reconcile_canonical_org_role_policy_truth'
    )
  ) THEN
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.normalize_org_role_compat(role_value TEXT)
    RETURNS TEXT
    LANGUAGE sql
    IMMUTABLE
    AS $body$
      SELECT CASE role_value
        WHEN 'owner' THEN 'org_owner'
        WHEN 'admin' THEN 'org_manager'
        WHEN 'member' THEN 'org_reviewer'
        WHEN 'viewer' THEN 'org_reviewer'
        ELSE role_value
      END
    $body$;
  $fn$;
END $$;

COMMIT;
