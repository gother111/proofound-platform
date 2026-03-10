-- Block 12 hardening: protect canonical proof and verification tables with RLS.

ALTER TABLE public.proof_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_pack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'proof_artifacts'
      AND policyname = 'proof_artifacts_owner_access'
  ) THEN
    CREATE POLICY proof_artifacts_owner_access
      ON public.proof_artifacts
      FOR ALL
      USING (
        (owner_type = 'individual_profile' AND owner_id = public.current_profile_id())
        OR (owner_type = 'organization' AND owner_id = ANY(public.current_org_ids()))
      )
      WITH CHECK (
        (owner_type = 'individual_profile' AND owner_id = public.current_profile_id())
        OR (owner_type = 'organization' AND owner_id = ANY(public.current_org_ids()))
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'proof_packs'
      AND policyname = 'proof_packs_owner_access'
  ) THEN
    CREATE POLICY proof_packs_owner_access
      ON public.proof_packs
      FOR ALL
      USING (
        (owner_type = 'individual_profile' AND owner_id = public.current_profile_id())
        OR (owner_type = 'organization' AND owner_id = ANY(public.current_org_ids()))
      )
      WITH CHECK (
        (owner_type = 'individual_profile' AND owner_id = public.current_profile_id())
        OR (owner_type = 'organization' AND owner_id = ANY(public.current_org_ids()))
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'proof_pack_items'
      AND policyname = 'proof_pack_items_owner_access'
  ) THEN
    CREATE POLICY proof_pack_items_owner_access
      ON public.proof_pack_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1
          FROM public.proof_packs pp
          WHERE pp.id = proof_pack_items.pack_id
            AND (
              (pp.owner_type = 'individual_profile' AND pp.owner_id = public.current_profile_id())
              OR (pp.owner_type = 'organization' AND pp.owner_id = ANY(public.current_org_ids()))
            )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.proof_packs pp
          WHERE pp.id = proof_pack_items.pack_id
            AND (
              (pp.owner_type = 'individual_profile' AND pp.owner_id = public.current_profile_id())
              OR (pp.owner_type = 'organization' AND pp.owner_id = ANY(public.current_org_ids()))
            )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'verification_records'
      AND policyname = 'verification_records_owner_access'
  ) THEN
    CREATE POLICY verification_records_owner_access
      ON public.verification_records
      FOR ALL
      USING (
        (owner_type = 'individual_profile' AND owner_id = public.current_profile_id())
        OR (owner_type = 'organization' AND owner_id = ANY(public.current_org_ids()))
      )
      WITH CHECK (
        (owner_type = 'individual_profile' AND owner_id = public.current_profile_id())
        OR (owner_type = 'organization' AND owner_id = ANY(public.current_org_ids()))
      );
  END IF;
END $$;
