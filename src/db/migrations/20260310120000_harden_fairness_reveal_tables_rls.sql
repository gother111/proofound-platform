-- Harden fairness/reveal explainability tables with explicit RLS policies.
-- Prevent authenticated cross-tenant access via PostgREST.

BEGIN;

ALTER TABLE public.match_review_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reveal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_reason_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fairness_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fairness_remediation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Match review states service select" ON public.match_review_states;
CREATE POLICY "Match review states service select"
  ON public.match_review_states FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Match review states service insert" ON public.match_review_states;
CREATE POLICY "Match review states service insert"
  ON public.match_review_states FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Match review states service update" ON public.match_review_states;
CREATE POLICY "Match review states service update"
  ON public.match_review_states FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Match review states service delete" ON public.match_review_states;
CREATE POLICY "Match review states service delete"
  ON public.match_review_states FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Reveal events service select" ON public.reveal_events;
CREATE POLICY "Reveal events service select"
  ON public.reveal_events FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Reveal events service insert" ON public.reveal_events;
CREATE POLICY "Reveal events service insert"
  ON public.reveal_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Reveal events service update" ON public.reveal_events;
CREATE POLICY "Reveal events service update"
  ON public.reveal_events FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Reveal events service delete" ON public.reveal_events;
CREATE POLICY "Reveal events service delete"
  ON public.reveal_events FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Match reason ledger service select" ON public.match_reason_ledger;
CREATE POLICY "Match reason ledger service select"
  ON public.match_reason_ledger FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Match reason ledger service insert" ON public.match_reason_ledger;
CREATE POLICY "Match reason ledger service insert"
  ON public.match_reason_ledger FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Match reason ledger service update" ON public.match_reason_ledger;
CREATE POLICY "Match reason ledger service update"
  ON public.match_reason_ledger FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Match reason ledger service delete" ON public.match_reason_ledger;
CREATE POLICY "Match reason ledger service delete"
  ON public.match_reason_ledger FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Fairness evaluations service select" ON public.fairness_evaluations;
CREATE POLICY "Fairness evaluations service select"
  ON public.fairness_evaluations FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Fairness evaluations service insert" ON public.fairness_evaluations;
CREATE POLICY "Fairness evaluations service insert"
  ON public.fairness_evaluations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Fairness evaluations service update" ON public.fairness_evaluations;
CREATE POLICY "Fairness evaluations service update"
  ON public.fairness_evaluations FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Fairness evaluations service delete" ON public.fairness_evaluations;
CREATE POLICY "Fairness evaluations service delete"
  ON public.fairness_evaluations FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Fairness remediation events service select" ON public.fairness_remediation_events;
CREATE POLICY "Fairness remediation events service select"
  ON public.fairness_remediation_events FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Fairness remediation events service insert" ON public.fairness_remediation_events;
CREATE POLICY "Fairness remediation events service insert"
  ON public.fairness_remediation_events FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Fairness remediation events service update" ON public.fairness_remediation_events;
CREATE POLICY "Fairness remediation events service update"
  ON public.fairness_remediation_events FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Fairness remediation events service delete" ON public.fairness_remediation_events;
CREATE POLICY "Fairness remediation events service delete"
  ON public.fairness_remediation_events FOR DELETE
  USING (auth.role() = 'service_role');

COMMIT;
