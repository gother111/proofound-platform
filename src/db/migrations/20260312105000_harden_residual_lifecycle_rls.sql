BEGIN;

ALTER TABLE public.residual_lifecycle_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_portability_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_portability_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_deletion_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_portability_exports'
      AND policyname = 'data_portability_exports_select_own'
  ) THEN
    CREATE POLICY data_portability_exports_select_own
      ON public.data_portability_exports
      FOR SELECT
      TO authenticated
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_portability_exports'
      AND policyname = 'data_portability_exports_insert_own'
  ) THEN
    CREATE POLICY data_portability_exports_insert_own
      ON public.data_portability_exports
      FOR INSERT
      TO authenticated
      WITH CHECK (
        profile_id = auth.uid()
        AND (requested_by IS NULL OR requested_by = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_portability_imports'
      AND policyname = 'data_portability_imports_select_own'
  ) THEN
    CREATE POLICY data_portability_imports_select_own
      ON public.data_portability_imports
      FOR SELECT
      TO authenticated
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'data_portability_imports'
      AND policyname = 'data_portability_imports_insert_own'
  ) THEN
    CREATE POLICY data_portability_imports_insert_own
      ON public.data_portability_imports
      FOR INSERT
      TO authenticated
      WITH CHECK (
        profile_id = auth.uid()
        AND (requested_by IS NULL OR requested_by = auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_deletion_requests'
      AND policyname = 'profile_deletion_requests_select_own'
  ) THEN
    CREATE POLICY profile_deletion_requests_select_own
      ON public.profile_deletion_requests
      FOR SELECT
      TO authenticated
      USING (profile_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profile_deletion_requests'
      AND policyname = 'profile_deletion_requests_insert_own'
  ) THEN
    CREATE POLICY profile_deletion_requests_insert_own
      ON public.profile_deletion_requests
      FOR INSERT
      TO authenticated
      WITH CHECK (
        profile_id = auth.uid()
        AND (requested_by IS NULL OR requested_by = auth.uid())
      );
  END IF;
END $$;

COMMIT;
