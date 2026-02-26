-- Fix skill verification request RLS policies that depended on auth.users access.
-- The authenticated role cannot read auth.users directly in production contexts.
BEGIN;

DROP POLICY IF EXISTS "Users can view verification requests sent to them"
ON public.skill_verification_requests;

CREATE POLICY "Users can view verification requests sent to them"
  ON public.skill_verification_requests
  FOR SELECT
  USING (
    auth.uid() = verifier_profile_id
    OR (
      verifier_email IS NOT NULL
      AND nullif(trim(auth.jwt() ->> 'email'), '') IS NOT NULL
      AND lower(verifier_email) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "Verifiers can respond to verification requests"
ON public.skill_verification_requests;

CREATE POLICY "Verifiers can respond to verification requests"
  ON public.skill_verification_requests
  FOR UPDATE
  USING (
    auth.uid() = verifier_profile_id
    OR (
      verifier_email IS NOT NULL
      AND nullif(trim(auth.jwt() ->> 'email'), '') IS NOT NULL
      AND lower(verifier_email) = lower(trim(auth.jwt() ->> 'email'))
    )
  )
  WITH CHECK (
    auth.uid() = verifier_profile_id
    OR (
      verifier_email IS NOT NULL
      AND nullif(trim(auth.jwt() ->> 'email'), '') IS NOT NULL
      AND lower(verifier_email) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

COMMIT;
