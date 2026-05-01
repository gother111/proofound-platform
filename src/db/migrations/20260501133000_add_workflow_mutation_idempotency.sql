BEGIN;

CREATE TABLE IF NOT EXISTS public.workflow_idempotency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  scope_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'processing',
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workflow_idempotency_state_check
    CHECK (state IN ('processing', 'completed', 'failed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS workflow_idempotency_records_scope_key_unique
  ON public.workflow_idempotency_records (scope_key);

CREATE INDEX IF NOT EXISTS workflow_idempotency_user_action_resource_idx
  ON public.workflow_idempotency_records (user_id, action, resource_type, resource_id);

CREATE INDEX IF NOT EXISTS workflow_idempotency_org_action_idx
  ON public.workflow_idempotency_records (org_id, action);

ALTER TABLE public.workflow_idempotency_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workflow idempotency service select" ON public.workflow_idempotency_records;
CREATE POLICY "Workflow idempotency service select"
  ON public.workflow_idempotency_records FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow idempotency service insert" ON public.workflow_idempotency_records;
CREATE POLICY "Workflow idempotency service insert"
  ON public.workflow_idempotency_records FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow idempotency service update" ON public.workflow_idempotency_records;
CREATE POLICY "Workflow idempotency service update"
  ON public.workflow_idempotency_records FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Workflow idempotency service delete" ON public.workflow_idempotency_records;
CREATE POLICY "Workflow idempotency service delete"
  ON public.workflow_idempotency_records FOR DELETE
  USING (auth.role() = 'service_role');

COMMIT;
