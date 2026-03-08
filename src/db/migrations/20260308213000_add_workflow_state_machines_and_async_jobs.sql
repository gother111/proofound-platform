BEGIN;

UPDATE assignments
SET status = 'hold'
WHERE status = 'paused';

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS held_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hold_reason TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_reason TEXT;

CREATE TABLE IF NOT EXISTS assignment_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason_code TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assignment_state_transitions_assignment_created_at_idx
  ON assignment_state_transitions (assignment_id, created_at);

CREATE TABLE IF NOT EXISTS intro_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  candidate_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'pending_org_interest',
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  candidate_invite_id UUID REFERENCES org_candidate_invites(id) ON DELETE SET NULL,
  duplicate_of_intro_id UUID REFERENCES intro_workflows(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  withdrawn_by_actor_type TEXT,
  withdrawn_by_actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  close_reason TEXT,
  closed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS intro_workflows_assignment_candidate_idx
  ON intro_workflows (assignment_id, candidate_profile_id);
CREATE INDEX IF NOT EXISTS intro_workflows_org_state_idx
  ON intro_workflows (org_id, state);
CREATE INDEX IF NOT EXISTS intro_workflows_match_idx
  ON intro_workflows (match_id);
CREATE INDEX IF NOT EXISTS intro_workflows_conversation_idx
  ON intro_workflows (conversation_id);
CREATE INDEX IF NOT EXISTS intro_workflows_invite_idx
  ON intro_workflows (candidate_invite_id);
CREATE UNIQUE INDEX IF NOT EXISTS intro_workflows_active_assignment_candidate_unique
  ON intro_workflows (assignment_id, candidate_profile_id)
  WHERE state IN (
    'pending_candidate_interest',
    'pending_org_interest',
    'mutual',
    'conversation_open',
    'interview_handoff'
  );

CREATE TABLE IF NOT EXISTS intro_workflow_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intro_workflow_id UUID NOT NULL REFERENCES intro_workflows(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason_code TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS intro_workflow_state_transitions_intro_created_at_idx
  ON intro_workflow_state_transitions (intro_workflow_id, created_at);

ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reschedule_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS interview_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason_code TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interview_state_transitions_interview_created_at_idx
  ON interview_state_transitions (interview_id, created_at);

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  decision TEXT,
  feedback TEXT,
  hours_since_interview NUMERIC(10, 2),
  within_sla BOOLEAN NOT NULL DEFAULT FALSE,
  intro_id UUID REFERENCES intro_workflows(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  candidate_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  latest_interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'pending',
  hold_until TIMESTAMPTZ,
  reason_code TEXT,
  internal_note TEXT,
  made_by_actor_type TEXT,
  made_by_actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  superseded_by_decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  reopened_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS decision TEXT,
  ADD COLUMN IF NOT EXISTS feedback TEXT,
  ADD COLUMN IF NOT EXISTS hours_since_interview NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS within_sla BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intro_id UUID REFERENCES intro_workflows(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS candidate_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS latest_interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reason_code TEXT,
  ADD COLUMN IF NOT EXISTS internal_note TEXT,
  ADD COLUMN IF NOT EXISTS made_by_actor_type TEXT,
  ADD COLUMN IF NOT EXISTS made_by_actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_by_decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS decisions_intro_unique
  ON decisions (intro_id)
  WHERE intro_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS decisions_assignment_state_idx
  ON decisions (assignment_id, state);
CREATE INDEX IF NOT EXISTS decisions_org_state_idx
  ON decisions (org_id, state);
CREATE INDEX IF NOT EXISTS decisions_candidate_state_idx
  ON decisions (candidate_profile_id, state);
CREATE INDEX IF NOT EXISTS decisions_latest_interview_idx
  ON decisions (latest_interview_id);

CREATE TABLE IF NOT EXISTS decision_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason_code TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS decision_state_transitions_decision_created_at_idx
  ON decision_state_transitions (decision_id, created_at);

ALTER TABLE verification_records
  ADD COLUMN IF NOT EXISTS request_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_code TEXT;

CREATE TABLE IF NOT EXISTS verification_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID NOT NULL REFERENCES verification_records(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason_code TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verification_state_transitions_verification_created_at_idx
  ON verification_state_transitions (verification_record_id, created_at);

CREATE TABLE IF NOT EXISTS consent_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'expired',
  required_version TEXT,
  granted_consent_id UUID REFERENCES user_consents(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  next_prompt_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS consent_obligations_profile_type_unique
  ON consent_obligations (profile_id, consent_type);
CREATE INDEX IF NOT EXISTS consent_obligations_state_prompt_idx
  ON consent_obligations (state, next_prompt_at);

CREATE TABLE IF NOT EXISTS consent_state_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_obligation_id UUID NOT NULL REFERENCES consent_obligations(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  trigger TEXT NOT NULL,
  reason_code TEXT,
  actor_type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS consent_state_transitions_consent_created_at_idx
  ON consent_state_transitions (consent_obligation_id, created_at);

CREATE TABLE IF NOT EXISTS workflow_async_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  intro_workflow_id UUID REFERENCES intro_workflows(id) ON DELETE SET NULL,
  interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
  decision_id UUID REFERENCES decisions(id) ON DELETE SET NULL,
  verification_record_id UUID REFERENCES verification_records(id) ON DELETE SET NULL,
  consent_obligation_id UUID REFERENCES consent_obligations(id) ON DELETE SET NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_expires_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  idempotency_key TEXT NOT NULL,
  dedupe_key TEXT,
  correlation_id TEXT,
  source_state TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  last_error TEXT,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS workflow_async_jobs_idempotency_key_unique
  ON workflow_async_jobs (idempotency_key);
CREATE INDEX IF NOT EXISTS workflow_async_jobs_status_scheduled_idx
  ON workflow_async_jobs (status, scheduled_at);
CREATE INDEX IF NOT EXISTS workflow_async_jobs_type_status_scheduled_idx
  ON workflow_async_jobs (job_type, status, scheduled_at);
CREATE INDEX IF NOT EXISTS workflow_async_jobs_correlation_idx
  ON workflow_async_jobs (correlation_id);
CREATE UNIQUE INDEX IF NOT EXISTS workflow_async_jobs_active_dedupe_unique
  ON workflow_async_jobs (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status IN ('pending', 'leased');

INSERT INTO intro_workflows (
  assignment_id,
  candidate_profile_id,
  org_id,
  state,
  match_id,
  conversation_id,
  expires_at,
  last_activity_at,
  created_at,
  updated_at
)
SELECT DISTINCT
  m.assignment_id,
  m.profile_id,
  a.org_id,
  CASE
    WHEN c.id IS NOT NULL THEN 'conversation_open'
    ELSE 'mutual'
  END AS state,
  m.id AS match_id,
  c.id AS conversation_id,
  COALESCE(c.created_at, NOW()) + INTERVAL '14 days' AS expires_at,
  COALESCE(c.last_message_at, c.created_at, NOW()) AS last_activity_at,
  COALESCE(c.created_at, NOW()) AS created_at,
  NOW() AS updated_at
FROM matches m
INNER JOIN assignments a ON a.id = m.assignment_id
INNER JOIN match_interest candidate_interest
  ON candidate_interest.assignment_id = m.assignment_id
 AND candidate_interest.actor_profile_id = m.profile_id
 AND candidate_interest.target_profile_id IS NULL
INNER JOIN match_interest org_interest
  ON org_interest.assignment_id = m.assignment_id
 AND org_interest.target_profile_id = m.profile_id
INNER JOIN organization_members om
  ON om.user_id = org_interest.actor_profile_id
 AND om.org_id = a.org_id
 AND om.status = 'active'
LEFT JOIN conversations c
  ON c.match_id = m.id
WHERE NOT EXISTS (
  SELECT 1
  FROM intro_workflows iw
  WHERE iw.assignment_id = m.assignment_id
    AND iw.candidate_profile_id = m.profile_id
)
ON CONFLICT DO NOTHING;

INSERT INTO intro_workflows (
  assignment_id,
  candidate_profile_id,
  org_id,
  state,
  match_id,
  expires_at,
  last_activity_at,
  created_at,
  updated_at
)
SELECT DISTINCT
  m.assignment_id,
  m.profile_id,
  a.org_id,
  'interview_handoff',
  m.id,
  NOW() + INTERVAL '14 days',
  COALESCE(i.updated_at, i.created_at, NOW()),
  COALESCE(i.created_at, NOW()),
  NOW()
FROM interviews i
INNER JOIN matches m ON m.id = i.match_id
INNER JOIN assignments a ON a.id = m.assignment_id
WHERE NOT EXISTS (
  SELECT 1
  FROM intro_workflows iw
  WHERE iw.match_id = m.id
)
ON CONFLICT DO NOTHING;

UPDATE decisions d
SET
  latest_interview_id = COALESCE(d.latest_interview_id, d.interview_id),
  state = CASE
    WHEN d.decision = 'hire' THEN 'hire'
    WHEN d.decision = 'advance' THEN 'advance'
    WHEN d.decision = 'hold' THEN 'hold'
    WHEN d.decision = 'reject' THEN 'reject'
    WHEN d.decision = 'accept' THEN 'advance'
    WHEN d.decision = 'decline' THEN 'reject'
    ELSE COALESCE(d.state, 'pending')
  END,
  assignment_id = COALESCE(d.assignment_id, m.assignment_id),
  candidate_profile_id = COALESCE(d.candidate_profile_id, m.profile_id),
  org_id = COALESCE(d.org_id, a.org_id),
  intro_id = COALESCE(d.intro_id, iw.id),
  internal_note = COALESCE(d.internal_note, d.feedback),
  updated_at = COALESCE(d.updated_at, NOW())
FROM interviews i
INNER JOIN matches m ON m.id = i.match_id
INNER JOIN assignments a ON a.id = m.assignment_id
LEFT JOIN intro_workflows iw ON iw.match_id = m.id
WHERE i.id = d.interview_id;

DO $$
DECLARE
  has_interview_decision BOOLEAN;
  has_interview_feedback BOOLEAN;
  has_interview_decided_at BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'interviews'
      AND column_name = 'decision'
  ) INTO has_interview_decision;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'interviews'
      AND column_name = 'feedback'
  ) INTO has_interview_feedback;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'interviews'
      AND column_name = 'decided_at'
  ) INTO has_interview_decided_at;

  IF has_interview_decision THEN
    EXECUTE format($sql$
      INSERT INTO decisions (
        intro_id,
        assignment_id,
        candidate_profile_id,
        org_id,
        latest_interview_id,
        interview_id,
        decision,
        feedback,
        state,
        created_at,
        updated_at
      )
      SELECT
        iw.id,
        m.assignment_id,
        m.profile_id,
        a.org_id,
        i.id,
        i.id,
        CASE
          WHEN i.decision = 'accept' THEN 'advance'
          WHEN i.decision = 'decline' THEN 'reject'
          ELSE NULL
        END,
        %s,
        CASE
          WHEN i.decision = 'accept' THEN 'advance'
          WHEN i.decision = 'decline' THEN 'reject'
          ELSE 'pending'
        END,
        COALESCE(%s, i.updated_at, NOW()),
        NOW()
      FROM interviews i
      INNER JOIN matches m ON m.id = i.match_id
      INNER JOIN assignments a ON a.id = m.assignment_id
      INNER JOIN intro_workflows iw ON iw.match_id = m.id
      LEFT JOIN decisions d ON d.latest_interview_id = i.id OR d.interview_id = i.id OR d.intro_id = iw.id
      WHERE d.id IS NULL
        AND (i.decision IS NOT NULL OR i.status = 'completed')
      ON CONFLICT DO NOTHING
    $sql$,
      CASE WHEN has_interview_feedback THEN 'i.feedback' ELSE 'NULL' END,
      CASE WHEN has_interview_decided_at THEN 'i.decided_at' ELSE 'NULL' END
    );
  ELSE
    INSERT INTO decisions (
      intro_id,
      assignment_id,
      candidate_profile_id,
      org_id,
      latest_interview_id,
      interview_id,
      state,
      created_at,
      updated_at
    )
    SELECT
      iw.id,
      m.assignment_id,
      m.profile_id,
      a.org_id,
      i.id,
      i.id,
      CASE
        WHEN i.status = 'completed' THEN 'pending'
        ELSE 'closed'
      END,
      COALESCE(i.updated_at, NOW()),
      NOW()
    FROM interviews i
    INNER JOIN matches m ON m.id = i.match_id
    INNER JOIN assignments a ON a.id = m.assignment_id
    INNER JOIN intro_workflows iw ON iw.match_id = m.id
    LEFT JOIN decisions d ON d.latest_interview_id = i.id OR d.interview_id = i.id OR d.intro_id = iw.id
    WHERE d.id IS NULL
      AND i.status = 'completed'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

INSERT INTO consent_obligations (
  profile_id,
  consent_type,
  state,
  required_version,
  granted_consent_id,
  next_prompt_at,
  created_at,
  updated_at
)
SELECT
  ranked.profile_id,
  ranked.consent_type,
  CASE
    WHEN ranked.consented = TRUE THEN 'active'
    ELSE 'revoked'
  END,
  ranked.version,
  ranked.id,
  CASE
    WHEN ranked.consented = TRUE THEN NULL
    ELSE NOW()
  END,
  COALESCE(ranked.consented_at, NOW()),
  NOW()
FROM (
  SELECT DISTINCT ON (uc.profile_id, uc.consent_type)
    uc.id,
    uc.profile_id,
    uc.consent_type,
    uc.consented,
    uc.version,
    uc.consented_at
  FROM user_consents uc
  ORDER BY uc.profile_id, uc.consent_type, uc.consented_at DESC, uc.created_at DESC
) ranked
ON CONFLICT (profile_id, consent_type) DO UPDATE
SET
  state = EXCLUDED.state,
  required_version = EXCLUDED.required_version,
  granted_consent_id = EXCLUDED.granted_consent_id,
  next_prompt_at = EXCLUDED.next_prompt_at,
  updated_at = NOW();

INSERT INTO assignment_state_transitions (
  assignment_id,
  from_state,
  to_state,
  trigger,
  reason_code,
  actor_type,
  metadata,
  created_at
)
SELECT
  a.id,
  NULL,
  a.status,
  'workflow_backfill',
  NULL,
  'system',
  '{}'::jsonb,
  a.created_at
FROM assignments a
WHERE NOT EXISTS (
  SELECT 1 FROM assignment_state_transitions ast WHERE ast.assignment_id = a.id
);

INSERT INTO intro_workflow_state_transitions (
  intro_workflow_id,
  from_state,
  to_state,
  trigger,
  reason_code,
  actor_type,
  metadata,
  created_at
)
SELECT
  iw.id,
  NULL,
  iw.state,
  'workflow_backfill',
  iw.close_reason,
  'system',
  '{}'::jsonb,
  iw.created_at
FROM intro_workflows iw
WHERE NOT EXISTS (
  SELECT 1 FROM intro_workflow_state_transitions it WHERE it.intro_workflow_id = iw.id
);

INSERT INTO interview_state_transitions (
  interview_id,
  from_state,
  to_state,
  trigger,
  reason_code,
  actor_type,
  metadata,
  created_at
)
SELECT
  i.id,
  NULL,
  i.status,
  'workflow_backfill',
  i.cancel_reason,
  'system',
  '{}'::jsonb,
  i.created_at
FROM interviews i
WHERE NOT EXISTS (
  SELECT 1 FROM interview_state_transitions ist WHERE ist.interview_id = i.id
);

INSERT INTO decision_state_transitions (
  decision_id,
  from_state,
  to_state,
  trigger,
  reason_code,
  actor_type,
  metadata,
  created_at
)
SELECT
  d.id,
  NULL,
  d.state,
  'workflow_backfill',
  d.reason_code,
  'system',
  '{}'::jsonb,
  d.created_at
FROM decisions d
WHERE d.intro_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM decision_state_transitions dst WHERE dst.decision_id = d.id
  );

INSERT INTO verification_state_transitions (
  verification_record_id,
  from_state,
  to_state,
  trigger,
  reason_code,
  actor_type,
  metadata,
  created_at
)
SELECT
  vr.id,
  NULL,
  vr.status,
  'workflow_backfill',
  vr.failure_code,
  'system',
  '{}'::jsonb,
  vr.created_at
FROM verification_records vr
WHERE NOT EXISTS (
  SELECT 1 FROM verification_state_transitions vst WHERE vst.verification_record_id = vr.id
);

INSERT INTO consent_state_transitions (
  consent_obligation_id,
  from_state,
  to_state,
  trigger,
  reason_code,
  actor_type,
  metadata,
  created_at
)
SELECT
  co.id,
  NULL,
  co.state,
  'workflow_backfill',
  NULL,
  'system',
  '{}'::jsonb,
  co.created_at
FROM consent_obligations co
WHERE NOT EXISTS (
  SELECT 1 FROM consent_state_transitions cst WHERE cst.consent_obligation_id = co.id
);

COMMIT;
