ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS model_version TEXT,
  ADD COLUMN IF NOT EXISTS explanation_version TEXT,
  ADD COLUMN IF NOT EXISTS fairness_check_version TEXT,
  ADD COLUMN IF NOT EXISTS fairness_status TEXT CHECK (
    fairness_status IN ('pass', 'unavailable', 'elevated', 'breach')
  ),
  ADD COLUMN IF NOT EXISTS fairness_evaluated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS matches_fairness_status_idx
  ON public.matches(fairness_status);

CREATE TABLE IF NOT EXISTS public.match_review_states (
  match_id UUID PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  review_stage TEXT NOT NULL DEFAULT 'blind_review' CHECK (
    review_stage IN ('blind_review', 'shortlisted', 'passed', 'rejected', 'closed')
  ),
  reveal_scope TEXT NOT NULL DEFAULT 'blind' CHECK (
    reveal_scope IN ('blind', 'shortlist_identity', 'full_identity')
  ),
  shortlisted_at TIMESTAMPTZ,
  shortlisted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision_at TIMESTAMPTZ,
  decision_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_identity_unlocked_at TIMESTAMPTZ,
  full_identity_unlocked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_identity_unlock_trigger TEXT CHECK (
    full_identity_unlock_trigger IN (
      'mutual_interest',
      'conversation_reveal',
      'interview_scheduled',
      'policy_override'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS match_review_states_assignment_stage_idx
  ON public.match_review_states(assignment_id, review_stage);

CREATE INDEX IF NOT EXISTS match_review_states_org_stage_idx
  ON public.match_review_states(org_id, review_stage);

CREATE INDEX IF NOT EXISTS match_review_states_profile_idx
  ON public.match_review_states(profile_id);

CREATE INDEX IF NOT EXISTS match_review_states_reveal_scope_idx
  ON public.match_review_states(reveal_scope);

CREATE TABLE IF NOT EXISTS public.reveal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  actor_type TEXT NOT NULL CHECK (
    actor_type IN ('user_account', 'organization', 'platform_admin', 'system')
  ),
  trigger_type TEXT NOT NULL CHECK (
    trigger_type IN ('user', 'system', 'policy', 'automatic')
  ),
  requested_scope TEXT NOT NULL CHECK (
    requested_scope IN ('blind', 'shortlist_identity', 'full_identity')
  ),
  granted_scope TEXT NOT NULL CHECK (
    granted_scope IN ('blind', 'shortlist_identity', 'full_identity')
  ),
  reason_code TEXT NOT NULL,
  source_surface TEXT,
  context_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome TEXT NOT NULL CHECK (outcome IN ('granted', 'denied', 'no_op')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reveal_events_match_occurred_idx
  ON public.reveal_events(match_id, occurred_at);

CREATE INDEX IF NOT EXISTS reveal_events_profile_occurred_idx
  ON public.reveal_events(profile_id, occurred_at);

CREATE INDEX IF NOT EXISTS reveal_events_org_occurred_idx
  ON public.reveal_events(org_id, occurred_at);

CREATE INDEX IF NOT EXISTS reveal_events_outcome_idx
  ON public.reveal_events(outcome, occurred_at);

CREATE TABLE IF NOT EXISTS public.match_reason_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN (
      'positive_match',
      'constraint_mismatch',
      'workflow_decision',
      'manual_override',
      'fairness'
    )
  ),
  reason_code TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('system', 'reviewer', 'policy')),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  importance INTEGER NOT NULL DEFAULT 50,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS match_reason_ledger_match_created_idx
  ON public.match_reason_ledger(match_id, created_at);

CREATE INDEX IF NOT EXISTS match_reason_ledger_assignment_category_idx
  ON public.match_reason_ledger(assignment_id, category, created_at);

CREATE INDEX IF NOT EXISTS match_reason_ledger_profile_category_idx
  ON public.match_reason_ledger(profile_id, category, created_at);

CREATE TABLE IF NOT EXISTS public.fairness_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'ranking_snapshot' CHECK (scope IN ('ranking_snapshot')),
  check_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'unavailable', 'elevated', 'breach')),
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  thresholds_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  eligible_cohort_count INTEGER NOT NULL DEFAULT 0,
  sample_sizes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  insufficient_reason TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fairness_evaluations_assignment_evaluated_idx
  ON public.fairness_evaluations(assignment_id, evaluated_at);

CREATE INDEX IF NOT EXISTS fairness_evaluations_status_idx
  ON public.fairness_evaluations(status, evaluated_at);

CREATE TABLE IF NOT EXISTS public.fairness_remediation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fairness_evaluation_id UUID REFERENCES public.fairness_evaluations(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (
    actor_type IN ('user_account', 'organization', 'platform_admin', 'system')
  ),
  action_type TEXT NOT NULL CHECK (
    action_type IN (
      'warning_issued',
      'ranking_suppressed',
      'admin_alert_sent',
      'acknowledged',
      'resolved',
      'recheck_requested'
    )
  ),
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fairness_remediation_events_assignment_occurred_idx
  ON public.fairness_remediation_events(assignment_id, occurred_at);

CREATE INDEX IF NOT EXISTS fairness_remediation_events_action_occurred_idx
  ON public.fairness_remediation_events(action_type, occurred_at);

DO $$
BEGIN
  IF to_regprocedure('public.handle_updated_at()') IS NOT NULL THEN
    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_match_review_states ON public.match_review_states;
      CREATE TRIGGER set_updated_at_match_review_states
      BEFORE UPDATE ON public.match_review_states
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';
  END IF;
END $$;

UPDATE public.matches
SET score_version = COALESCE(score_version, 'legacy/unknown'),
    generated_at = COALESCE(generated_at, created_at)
WHERE score_version IS NULL
   OR generated_at IS NULL;

INSERT INTO public.match_review_states (
  match_id,
  assignment_id,
  profile_id,
  org_id,
  review_stage,
  reveal_scope,
  created_at,
  updated_at
)
SELECT
  m.id,
  m.assignment_id,
  m.profile_id,
  a.org_id,
  'blind_review',
  'blind',
  COALESCE(m.generated_at, m.created_at, NOW()),
  NOW()
FROM public.matches m
INNER JOIN public.assignments a ON a.id = m.assignment_id
ON CONFLICT (match_id) DO NOTHING;

INSERT INTO public.match_reason_ledger (
  match_id,
  assignment_id,
  profile_id,
  category,
  reason_code,
  source,
  payload_json,
  importance,
  created_at
)
SELECT
  m.id,
  m.assignment_id,
  m.profile_id,
  CASE
    WHEN code IN ('skills_gap', 'verification_gap') THEN 'constraint_mismatch'
    ELSE 'positive_match'
  END,
  code,
  'system',
  '{}'::jsonb,
  50,
  COALESCE(m.generated_at, m.created_at, NOW())
FROM public.matches m
CROSS JOIN LATERAL unnest(COALESCE(m.reason_codes, '{}'::text[])) AS code
LEFT JOIN public.match_reason_ledger ledger
  ON ledger.match_id = m.id
 AND ledger.reason_code = code
WHERE ledger.id IS NULL;
