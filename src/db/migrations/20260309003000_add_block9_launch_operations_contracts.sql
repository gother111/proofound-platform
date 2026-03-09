ALTER TABLE IF EXISTS public.feature_flags
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS taxonomy TEXT,
  ADD COLUMN IF NOT EXISTS control_type TEXT,
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS revisit_after TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.feature_flags
SET updated_at = COALESCE(updated_at, NOW())
WHERE updated_at IS NULL;

ALTER TABLE IF EXISTS public.assignments
  ADD COLUMN IF NOT EXISTS operational_fallback_mode TEXT,
  ADD COLUMN IF NOT EXISTS operational_fallback_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS operational_fallback_resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS operational_fallback_reason_code TEXT,
  ADD COLUMN IF NOT EXISTS operational_fallback_operator_assisted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intro_hold_target_count INTEGER,
  ADD COLUMN IF NOT EXISTS intro_hold_current_count INTEGER;

CREATE INDEX IF NOT EXISTS assignments_operational_fallback_mode_idx
  ON public.assignments (operational_fallback_mode, created_at);

ALTER TABLE IF EXISTS public.match_review_states
  ADD COLUMN IF NOT EXISTS operational_fallback_mode TEXT,
  ADD COLUMN IF NOT EXISTS operational_fallback_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS operational_fallback_reason_code TEXT;

CREATE INDEX IF NOT EXISTS match_review_states_operational_fallback_mode_idx
  ON public.match_review_states (operational_fallback_mode, updated_at);

ALTER TABLE IF EXISTS public.feedback_responses
  ADD COLUMN IF NOT EXISTS decision_state TEXT,
  ADD COLUMN IF NOT EXISTS audience_variant TEXT,
  ADD COLUMN IF NOT EXISTS reason_code TEXT,
  ADD COLUMN IF NOT EXISTS personalized_note TEXT,
  ADD COLUMN IF NOT EXISTS suggested_next_step TEXT,
  ADD COLUMN IF NOT EXISTS author_role TEXT,
  ADD COLUMN IF NOT EXISTS rubric_version TEXT,
  ADD COLUMN IF NOT EXISTS rubric_subscores JSONB,
  ADD COLUMN IF NOT EXISTS reusable_template_id UUID,
  ADD COLUMN IF NOT EXISTS operator_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS internal_note TEXT;

CREATE INDEX IF NOT EXISTS feedback_responses_reason_code_idx
  ON public.feedback_responses (reason_code, created_at);

CREATE INDEX IF NOT EXISTS feedback_responses_decision_state_idx
  ON public.feedback_responses (decision_state, created_at);

CREATE TABLE IF NOT EXISTS public.operator_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  fallback_mode TEXT,
  reason_code TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS operator_action_logs_target_idx
  ON public.operator_action_logs (target_type, target_id, created_at);

CREATE INDEX IF NOT EXISTS operator_action_logs_action_idx
  ON public.operator_action_logs (action_type, created_at);

CREATE TABLE IF NOT EXISTS public.synthetic_monitor_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_key TEXT NOT NULL,
  monitor_group TEXT NOT NULL,
  status TEXT NOT NULL,
  severity TEXT NOT NULL,
  response_time_ms INTEGER,
  expected_state TEXT,
  observed_state TEXT,
  failure_class TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS synthetic_monitor_runs_monitor_checked_idx
  ON public.synthetic_monitor_runs (monitor_key, checked_at DESC);

CREATE INDEX IF NOT EXISTS synthetic_monitor_runs_status_checked_idx
  ON public.synthetic_monitor_runs (status, severity, checked_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignments_operational_fallback_mode_check'
      AND conrelid = 'public.assignments'::regclass
  ) THEN
    ALTER TABLE public.assignments
      ADD CONSTRAINT assignments_operational_fallback_mode_check
      CHECK (
        operational_fallback_mode IS NULL
        OR operational_fallback_mode IN (
          'browse_only_low_candidate_supply',
          'browse_only_low_assignment_supply',
          'proof_building_weak_coverage',
          'trust_pending_verification',
          'fairness_suppressed_ranking',
          'intro_hold_insufficient_qualified_intros'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.match_review_states') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'match_review_states_operational_fallback_mode_check'
        AND conrelid = 'public.match_review_states'::regclass
    ) THEN
    ALTER TABLE public.match_review_states
      ADD CONSTRAINT match_review_states_operational_fallback_mode_check
      CHECK (
        operational_fallback_mode IS NULL
        OR operational_fallback_mode IN (
          'browse_only_low_candidate_supply',
          'browse_only_low_assignment_supply',
          'proof_building_weak_coverage',
          'trust_pending_verification',
          'fairness_suppressed_ranking',
          'intro_hold_insufficient_qualified_intros'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'feature_flags_taxonomy_check'
      AND conrelid = 'public.feature_flags'::regclass
  ) THEN
    ALTER TABLE public.feature_flags
      ADD CONSTRAINT feature_flags_taxonomy_check
      CHECK (
        taxonomy IS NULL
        OR taxonomy IN (
          'default_on',
          'hidden_behind_flag',
          'pilot_only',
          'admin_operator_only',
          'post_mvp',
          'emergency_kill_switch'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'feature_flags_control_type_check'
      AND conrelid = 'public.feature_flags'::regclass
  ) THEN
    ALTER TABLE public.feature_flags
      ADD CONSTRAINT feature_flags_control_type_check
      CHECK (
        control_type IS NULL
        OR control_type IN ('temporary_rollout_control', 'durable_scope_control')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.feedback_responses') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'feedback_responses_audience_variant_check'
        AND conrelid = 'public.feedback_responses'::regclass
    ) THEN
    ALTER TABLE public.feedback_responses
      ADD CONSTRAINT feedback_responses_audience_variant_check
      CHECK (
        audience_variant IS NULL
        OR audience_variant IN ('candidate', 'organization')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.feedback_responses') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'feedback_responses_author_role_check'
        AND conrelid = 'public.feedback_responses'::regclass
    ) THEN
    ALTER TABLE public.feedback_responses
      ADD CONSTRAINT feedback_responses_author_role_check
      CHECK (
        author_role IS NULL
        OR author_role IN ('candidate', 'organization_member', 'platform_operator', 'system')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.feedback_responses') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'feedback_responses_decision_state_check'
        AND conrelid = 'public.feedback_responses'::regclass
    ) THEN
    ALTER TABLE public.feedback_responses
      ADD CONSTRAINT feedback_responses_decision_state_check
      CHECK (
        decision_state IS NULL
        OR decision_state IN (
          'pending',
          'under_review',
          'not_now',
          'closed',
          'passed',
          'shortlisted',
          'intro_on_hold',
          'verification_pending'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'synthetic_monitor_runs_status_check'
      AND conrelid = 'public.synthetic_monitor_runs'::regclass
  ) THEN
    ALTER TABLE public.synthetic_monitor_runs
      ADD CONSTRAINT synthetic_monitor_runs_status_check
      CHECK (status IN ('pass', 'degraded', 'fail'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'synthetic_monitor_runs_severity_check'
      AND conrelid = 'public.synthetic_monitor_runs'::regclass
  ) THEN
    ALTER TABLE public.synthetic_monitor_runs
      ADD CONSTRAINT synthetic_monitor_runs_severity_check
      CHECK (severity IN ('p1', 'p2', 'p3'));
  END IF;
END $$;
