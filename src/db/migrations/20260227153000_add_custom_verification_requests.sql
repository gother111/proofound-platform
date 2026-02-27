-- Add bundled custom verification request flow

CREATE TABLE IF NOT EXISTS public.custom_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verifier_email TEXT NOT NULL,
  verifier_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verifier_relationship TEXT NOT NULL CHECK (verifier_relationship IN ('peer', 'manager', 'external')),
  message TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  responded_at TIMESTAMPTZ,
  response_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_verification_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.custom_verification_requests(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('skill', 'experience', 'education', 'impact_story', 'project', 'volunteering')),
  artifact_id UUID NOT NULL,
  display_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT custom_verification_items_unique UNIQUE (request_id, artifact_type, artifact_id)
);

ALTER TABLE public.skill_verification_requests
  ADD COLUMN IF NOT EXISTS custom_request_id UUID REFERENCES public.custom_verification_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_custom_verification_requests_requester
  ON public.custom_verification_requests(requester_profile_id);

CREATE INDEX IF NOT EXISTS idx_custom_verification_requests_verifier_email
  ON public.custom_verification_requests(verifier_email);

CREATE INDEX IF NOT EXISTS idx_custom_verification_requests_status
  ON public.custom_verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_custom_verification_requests_expires_at
  ON public.custom_verification_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_custom_verification_request_items_request
  ON public.custom_verification_request_items(request_id);

CREATE INDEX IF NOT EXISTS idx_custom_verification_request_items_artifact
  ON public.custom_verification_request_items(artifact_type, artifact_id);

CREATE INDEX IF NOT EXISTS idx_skill_verification_custom_request_id
  ON public.skill_verification_requests(custom_request_id);

ALTER TABLE public.custom_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_verification_request_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Custom verification requests participants" ON public.custom_verification_requests;
CREATE POLICY "Custom verification requests participants"
  ON public.custom_verification_requests
  FOR ALL
  USING (
    requester_profile_id = auth.uid()
    OR verifier_profile_id = auth.uid()
  )
  WITH CHECK (
    requester_profile_id = auth.uid()
    OR verifier_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS "Custom verification request items participants" ON public.custom_verification_request_items;
CREATE POLICY "Custom verification request items participants"
  ON public.custom_verification_request_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.custom_verification_requests cvr
      WHERE cvr.id = custom_verification_request_items.request_id
        AND (
          cvr.requester_profile_id = auth.uid()
          OR cvr.verifier_profile_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.custom_verification_requests cvr
      WHERE cvr.id = custom_verification_request_items.request_id
        AND (
          cvr.requester_profile_id = auth.uid()
          OR cvr.verifier_profile_id = auth.uid()
        )
    )
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'custom_verification_requests'
        AND policyname = 'Custom verification requests service role'
    ) THEN
      EXECUTE '
        CREATE POLICY "Custom verification requests service role"
        ON public.custom_verification_requests
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
      ';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'custom_verification_request_items'
        AND policyname = 'Custom verification request items service role'
    ) THEN
      EXECUTE '
        CREATE POLICY "Custom verification request items service role"
        ON public.custom_verification_request_items
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
      ';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regprocedure('public.handle_updated_at()') IS NOT NULL THEN
    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_custom_verification_requests ON public.custom_verification_requests;
      CREATE TRIGGER set_updated_at_custom_verification_requests
      BEFORE UPDATE ON public.custom_verification_requests
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';

    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_custom_verification_request_items ON public.custom_verification_request_items;
      CREATE TRIGGER set_updated_at_custom_verification_request_items
      BEFORE UPDATE ON public.custom_verification_request_items
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';
  END IF;
END $$;

COMMENT ON TABLE public.custom_verification_requests IS 'Bundled verification requests covering multiple profile artifacts';
COMMENT ON TABLE public.custom_verification_request_items IS 'Selected artifacts tied to a bundled verification request';
COMMENT ON COLUMN public.skill_verification_requests.custom_request_id IS 'Optional link to a bundled custom verification request';
