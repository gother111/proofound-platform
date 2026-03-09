CREATE TABLE IF NOT EXISTS zen_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'zen_opt_in_changed',
      'zen_export_requested',
      'zen_export_completed',
      'zen_delete_requested',
      'zen_delete_completed',
      'zen_checkin_written',
      'zen_reflection_written'
    )
  ),
  actor_type TEXT NOT NULL DEFAULT 'candidate' CHECK (
    actor_type IN ('candidate', 'organization_member', 'platform_admin', 'system', 'service_account')
  ),
  route_source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zen_audit_events_user_created_idx
  ON zen_audit_events (user_id, created_at);
CREATE INDEX IF NOT EXISTS zen_audit_events_type_created_idx
  ON zen_audit_events (event_type, created_at);

CREATE TABLE IF NOT EXISTS proof_trust_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('individual_profile', 'organization')),
  subject_id UUID NOT NULL,
  context TEXT NOT NULL CHECK (context IN ('portfolio', 'matching')),
  proof_coverage_ratio NUMERIC NOT NULL DEFAULT 0,
  proof_backed_skill_count INTEGER NOT NULL DEFAULT 0,
  public_skill_count INTEGER NOT NULL DEFAULT 0,
  verification_coverage_ratio NUMERIC NOT NULL DEFAULT 0,
  time_to_verified_hours_p50 NUMERIC,
  trust_signal_coverage_count INTEGER NOT NULL DEFAULT 0,
  trust_signal_classes_present TEXT[] NOT NULL DEFAULT '{}'::text[],
  proof_freshness_state TEXT NOT NULL DEFAULT 'fresh' CHECK (
    proof_freshness_state IN ('fresh', 'review_soon', 'stale', 'expired')
  ),
  proof_freshness_distribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof_quality JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof_quality_summary NUMERIC,
  suggested_actions TEXT[] NOT NULL DEFAULT '{}'::text[],
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT proof_trust_snapshots_subject_context_unique UNIQUE (subject_type, subject_id, context)
);

CREATE INDEX IF NOT EXISTS proof_trust_snapshots_subject_idx
  ON proof_trust_snapshots (subject_type, subject_id);

CREATE TABLE IF NOT EXISTS portfolio_publication_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('individual_profile', 'organization')),
  subject_id UUID NOT NULL,
  requested_state TEXT NOT NULL CHECK (
    requested_state IN ('unavailable', 'public_link_only', 'public_noindex', 'public_indexable')
  ),
  effective_state TEXT NOT NULL CHECK (
    effective_state IN ('unavailable', 'public_link_only', 'public_noindex', 'public_indexable')
  ),
  publication_state TEXT NOT NULL CHECK (
    publication_state IN ('unavailable', 'public_link_only', 'public_noindex', 'public_indexable')
  ),
  indexing_state TEXT NOT NULL CHECK (indexing_state IN ('unavailable', 'noindex', 'indexable')),
  robots_state TEXT NOT NULL CHECK (robots_state IN ('noindex_nofollow', 'index_follow')),
  sitemap_state TEXT NOT NULL CHECK (sitemap_state IN ('excluded', 'included')),
  reason_codes TEXT[] NOT NULL DEFAULT '{}'::text[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT portfolio_publication_states_subject_unique UNIQUE (subject_type, subject_id)
);

CREATE INDEX IF NOT EXISTS portfolio_publication_states_effective_state_idx
  ON portfolio_publication_states (effective_state, indexing_state);

ALTER TABLE metric_snapshots
  DROP CONSTRAINT IF EXISTS metric_snapshots_metric_type_check;

ALTER TABLE metric_snapshots
  ADD CONSTRAINT metric_snapshots_metric_type_check
  CHECK (
    metric_type IN (
      'ttsc',
      'ttfqi',
      'ttv',
      'pac',
      'sus',
      'wellbeing_delta',
      'proof_coverage',
      'proof_quality',
      'proof_freshness',
      'verification_coverage',
      'time_to_verified',
      'trust_signal_coverage',
      'reveal_rate',
      'intro_expiry_rate',
      'withdrawal_rate',
      'no_show_rate',
      'override_rate',
      'portfolio_indexing_coverage'
    )
  );
