BEGIN;

ALTER TABLE public.intro_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intro_workflow_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_state_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_async_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workflow intro service select" ON public.intro_workflows;
CREATE POLICY "Workflow intro service select"
  ON public.intro_workflows FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow intro service insert" ON public.intro_workflows;
CREATE POLICY "Workflow intro service insert"
  ON public.intro_workflows FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow intro service update" ON public.intro_workflows;
CREATE POLICY "Workflow intro service update"
  ON public.intro_workflows FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow intro service delete" ON public.intro_workflows;
CREATE POLICY "Workflow intro service delete"
  ON public.intro_workflows FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow intro transitions service select" ON public.intro_workflow_state_transitions;
CREATE POLICY "Workflow intro transitions service select"
  ON public.intro_workflow_state_transitions FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow intro transitions service insert" ON public.intro_workflow_state_transitions;
CREATE POLICY "Workflow intro transitions service insert"
  ON public.intro_workflow_state_transitions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow intro transitions service update" ON public.intro_workflow_state_transitions;
CREATE POLICY "Workflow intro transitions service update"
  ON public.intro_workflow_state_transitions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow intro transitions service delete" ON public.intro_workflow_state_transitions;
CREATE POLICY "Workflow intro transitions service delete"
  ON public.intro_workflow_state_transitions FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow assignment transitions service select" ON public.assignment_state_transitions;
CREATE POLICY "Workflow assignment transitions service select"
  ON public.assignment_state_transitions FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow assignment transitions service insert" ON public.assignment_state_transitions;
CREATE POLICY "Workflow assignment transitions service insert"
  ON public.assignment_state_transitions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow assignment transitions service update" ON public.assignment_state_transitions;
CREATE POLICY "Workflow assignment transitions service update"
  ON public.assignment_state_transitions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow assignment transitions service delete" ON public.assignment_state_transitions;
CREATE POLICY "Workflow assignment transitions service delete"
  ON public.assignment_state_transitions FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow interview transitions service select" ON public.interview_state_transitions;
CREATE POLICY "Workflow interview transitions service select"
  ON public.interview_state_transitions FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow interview transitions service insert" ON public.interview_state_transitions;
CREATE POLICY "Workflow interview transitions service insert"
  ON public.interview_state_transitions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow interview transitions service update" ON public.interview_state_transitions;
CREATE POLICY "Workflow interview transitions service update"
  ON public.interview_state_transitions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow interview transitions service delete" ON public.interview_state_transitions;
CREATE POLICY "Workflow interview transitions service delete"
  ON public.interview_state_transitions FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow decision transitions service select" ON public.decision_state_transitions;
CREATE POLICY "Workflow decision transitions service select"
  ON public.decision_state_transitions FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow decision transitions service insert" ON public.decision_state_transitions;
CREATE POLICY "Workflow decision transitions service insert"
  ON public.decision_state_transitions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow decision transitions service update" ON public.decision_state_transitions;
CREATE POLICY "Workflow decision transitions service update"
  ON public.decision_state_transitions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow decision transitions service delete" ON public.decision_state_transitions;
CREATE POLICY "Workflow decision transitions service delete"
  ON public.decision_state_transitions FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow verification transitions service select" ON public.verification_state_transitions;
CREATE POLICY "Workflow verification transitions service select"
  ON public.verification_state_transitions FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow verification transitions service insert" ON public.verification_state_transitions;
CREATE POLICY "Workflow verification transitions service insert"
  ON public.verification_state_transitions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow verification transitions service update" ON public.verification_state_transitions;
CREATE POLICY "Workflow verification transitions service update"
  ON public.verification_state_transitions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow verification transitions service delete" ON public.verification_state_transitions;
CREATE POLICY "Workflow verification transitions service delete"
  ON public.verification_state_transitions FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow consent obligations service select" ON public.consent_obligations;
CREATE POLICY "Workflow consent obligations service select"
  ON public.consent_obligations FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow consent obligations service insert" ON public.consent_obligations;
CREATE POLICY "Workflow consent obligations service insert"
  ON public.consent_obligations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow consent obligations service update" ON public.consent_obligations;
CREATE POLICY "Workflow consent obligations service update"
  ON public.consent_obligations FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow consent obligations service delete" ON public.consent_obligations;
CREATE POLICY "Workflow consent obligations service delete"
  ON public.consent_obligations FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow consent transitions service select" ON public.consent_state_transitions;
CREATE POLICY "Workflow consent transitions service select"
  ON public.consent_state_transitions FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow consent transitions service insert" ON public.consent_state_transitions;
CREATE POLICY "Workflow consent transitions service insert"
  ON public.consent_state_transitions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow consent transitions service update" ON public.consent_state_transitions;
CREATE POLICY "Workflow consent transitions service update"
  ON public.consent_state_transitions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow consent transitions service delete" ON public.consent_state_transitions;
CREATE POLICY "Workflow consent transitions service delete"
  ON public.consent_state_transitions FOR DELETE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow async jobs service select" ON public.workflow_async_jobs;
CREATE POLICY "Workflow async jobs service select"
  ON public.workflow_async_jobs FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow async jobs service insert" ON public.workflow_async_jobs;
CREATE POLICY "Workflow async jobs service insert"
  ON public.workflow_async_jobs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow async jobs service update" ON public.workflow_async_jobs;
CREATE POLICY "Workflow async jobs service update"
  ON public.workflow_async_jobs FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow async jobs service delete" ON public.workflow_async_jobs;
CREATE POLICY "Workflow async jobs service delete"
  ON public.workflow_async_jobs FOR DELETE
  USING (auth.role() = 'service_role');

COMMIT;
