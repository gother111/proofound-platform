-- Hardening: enforce RLS for verification contradictions/disputes.

ALTER TABLE IF EXISTS public.verification_contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_disputes ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.verification_contradictions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_disputes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verification_contradictions_service_role_all ON public.verification_contradictions;
DROP POLICY IF EXISTS verification_disputes_service_role_all ON public.verification_disputes;

CREATE POLICY verification_contradictions_service_role_all
  ON public.verification_contradictions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY verification_disputes_service_role_all
  ON public.verification_disputes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
