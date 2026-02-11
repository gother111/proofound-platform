-- Tighten verification_requests RLS to prevent anonymous enumeration and mass updates.
-- Token-based verifier flows must go through server-side endpoints that validate the token.

BEGIN;

DROP POLICY IF EXISTS "verifier_reads_by_token" ON public.verification_requests;

CREATE POLICY "verifier_reads_by_email"
  ON public.verification_requests
  FOR SELECT
  USING ((auth.jwt() ->> 'email') = verifier_email);

DROP POLICY IF EXISTS "verifier_responds" ON public.verification_requests;

CREATE POLICY "verifier_responds_by_email"
  ON public.verification_requests
  FOR UPDATE
  USING ((auth.jwt() ->> 'email') = verifier_email)
  WITH CHECK (
    status IN ('verified', 'declined')
    AND responded_at IS NOT NULL
    AND (auth.jwt() ->> 'email') = verifier_email
  );

COMMIT;
