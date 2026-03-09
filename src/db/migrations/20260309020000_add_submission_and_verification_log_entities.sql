CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_kind TEXT NOT NULL CHECK (
    submission_kind IN (
      'assignment_section',
      'proof_card',
      'application_proof',
      'intro_proof',
      'verification_response_payload',
      'manual_upload'
    )
  ),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (
    status IN (
      'draft',
      'submitted',
      'under_review',
      'accepted',
      'rejected',
      'withdrawn',
      'superseded'
    )
  ),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('individual_profile', 'organization')),
  owner_id UUID NOT NULL,
  submitted_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_by_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  proof_pack_id UUID REFERENCES public.proof_packs(id) ON DELETE SET NULL,
  request_context_type TEXT NOT NULL CHECK (
    request_context_type IN (
      'assignment',
      'assignment_invitation',
      'candidate_invite',
      'match',
      'intro',
      'application',
      'verification_request',
      'manual'
    )
  ),
  request_context_id UUID,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  intro_id UUID REFERENCES public.intro_workflows(id) ON DELETE SET NULL,
  application_id UUID,
  legacy_source_table TEXT,
  legacy_source_id UUID,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  superseded_by_submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_owner_submitted
  ON public.submissions(owner_type, owner_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_submitted
  ON public.submissions(assignment_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_request_context
  ON public.submissions(request_context_type, request_context_id);

CREATE INDEX IF NOT EXISTS idx_submissions_proof_pack
  ON public.submissions(proof_pack_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_legacy_source_unique
  ON public.submissions(legacy_source_table, legacy_source_id)
  WHERE legacy_source_table IS NOT NULL AND legacy_source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.submission_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES public.proof_artifacts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  included_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submission_artifacts_submission
  ON public.submission_artifacts(submission_id, position);

CREATE INDEX IF NOT EXISTS idx_submission_artifacts_artifact
  ON public.submission_artifacts(artifact_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_submission_artifacts_unique
  ON public.submission_artifacts(submission_id, artifact_id);

CREATE TABLE IF NOT EXISTS public.verification_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID NOT NULL REFERENCES public.verification_records(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  entry_type TEXT NOT NULL CHECK (
    entry_type IN (
      'record_created',
      'state_transition',
      'refresh_requested',
      'refresh_completed',
      'expired',
      'downgraded',
      'contradiction_detected',
      'dispute_opened',
      'dispute_updated',
      'dispute_resolved',
      'revoked',
      'superseded',
      'restored',
      'recomputed'
    )
  ),
  from_status TEXT CHECK (
    from_status IN (
      'pending',
      'verified',
      'expired',
      'superseded',
      'downgraded',
      'contradicted',
      'disputed',
      'revoked',
      'declined',
      'cancelled',
      'failed'
    )
  ),
  to_status TEXT CHECK (
    to_status IN (
      'pending',
      'verified',
      'expired',
      'superseded',
      'downgraded',
      'contradicted',
      'disputed',
      'revoked',
      'declined',
      'cancelled',
      'failed'
    )
  ),
  reason_code TEXT,
  actor_type TEXT NOT NULL CHECK (
    actor_type IN ('candidate', 'organization_member', 'platform_admin', 'system', 'service_account')
  ),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_contradiction_id UUID REFERENCES public.verification_contradictions(id) ON DELETE SET NULL,
  related_dispute_id UUID REFERENCES public.verification_disputes(id) ON DELETE SET NULL,
  related_verification_record_id UUID REFERENCES public.verification_records(id) ON DELETE SET NULL,
  recompute_batch_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_log_entries_sequence_unique
  ON public.verification_log_entries(verification_record_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_verification_log_entries_verification_occurred
  ON public.verification_log_entries(verification_record_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_log_entries_entry_type_occurred
  ON public.verification_log_entries(entry_type, occurred_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'set_updated_at'
  ) THEN
    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_submissions ON public.submissions;
      CREATE TRIGGER set_updated_at_submissions
      BEFORE UPDATE ON public.submissions
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    ';

    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_submission_artifacts ON public.submission_artifacts;
      CREATE TRIGGER set_updated_at_submission_artifacts
      BEFORE UPDATE ON public.submission_artifacts
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    ';
  END IF;
END $$;

INSERT INTO public.submissions (
  submission_kind,
  status,
  owner_type,
  owner_id,
  submitted_by_user_id,
  submitted_by_org_id,
  assignment_id,
  proof_pack_id,
  request_context_type,
  request_context_id,
  match_id,
  intro_id,
  application_id,
  legacy_source_table,
  legacy_source_id,
  submitted_at,
  reviewed_at,
  metadata
)
SELECT
  'assignment_section',
  CASE s.review_status
    WHEN 'approved' THEN 'accepted'
    WHEN 'rejected' THEN 'rejected'
    WHEN 'needs_changes' THEN 'under_review'
    ELSE 'submitted'
  END,
  'organization',
  i.org_id,
  NULL,
  NULL,
  NULL,
  NULL,
  'assignment_invitation',
  s.invitation_id,
  NULL,
  NULL,
  NULL,
  'assignment_submissions',
  s.id,
  s.submitted_at,
  s.reviewed_at,
  jsonb_build_object(
    'section_name', s.section_name,
    'section_data', s.section_data,
    'legacy_review_status', s.review_status,
    'legacy_review_notes', s.review_notes,
    'stakeholder_email', i.stakeholder_email
  )
FROM public.assignment_submissions s
INNER JOIN public.assignment_invitations i
  ON i.id = s.invitation_id
LEFT JOIN public.submissions existing
  ON existing.legacy_source_table = 'assignment_submissions'
 AND existing.legacy_source_id = s.id
WHERE existing.id IS NULL;

INSERT INTO public.submissions (
  submission_kind,
  status,
  owner_type,
  owner_id,
  submitted_by_user_id,
  submitted_by_org_id,
  assignment_id,
  proof_pack_id,
  request_context_type,
  request_context_id,
  match_id,
  intro_id,
  application_id,
  legacy_source_table,
  legacy_source_id,
  submitted_at,
  metadata
)
SELECT
  'proof_card',
  CASE invite.status
    WHEN 'revoked' THEN 'withdrawn'
    ELSE 'submitted'
  END,
  'individual_profile',
  invite.claimed_by_profile_id,
  invite.claimed_by_profile_id,
  NULL,
  invite.assignment_id,
  pack.id,
  'candidate_invite',
  invite.id,
  invite.match_id,
  NULL,
  NULL,
  'org_candidate_invites',
  invite.id,
  COALESCE(invite.proof_submitted_at, invite.updated_at, invite.created_at),
  jsonb_build_object(
    'proof_snippet_id', invite.proof_snippet_id,
    'conversation_id', invite.conversation_id,
    'flow_type', invite.flow_type
  )
FROM public.org_candidate_invites invite
LEFT JOIN public.proof_packs pack
  ON pack.legacy_source_table = 'profile_snippets'
 AND pack.legacy_source_id = invite.proof_snippet_id
LEFT JOIN public.submissions existing
  ON existing.legacy_source_table = 'org_candidate_invites'
 AND existing.legacy_source_id = invite.id
WHERE invite.flow_type = 'proof_card'
  AND invite.proof_submitted_at IS NOT NULL
  AND invite.claimed_by_profile_id IS NOT NULL
  AND existing.id IS NULL;

INSERT INTO public.submission_artifacts (
  submission_id,
  artifact_id,
  position,
  included_fields
)
SELECT
  s.id,
  ppi.artifact_id,
  ppi.position,
  ppi.included_fields
FROM public.submissions s
INNER JOIN public.proof_pack_items ppi
  ON ppi.pack_id = s.proof_pack_id
LEFT JOIN public.submission_artifacts existing
  ON existing.submission_id = s.id
 AND existing.artifact_id = ppi.artifact_id
WHERE s.proof_pack_id IS NOT NULL
  AND existing.id IS NULL;

WITH dispute_events AS (
  SELECT
    d.verification_record_id,
    d.opened_at AS occurred_at,
    3 AS source_priority,
    'dispute_opened'::text AS entry_type,
    NULL::text AS from_status,
    'disputed'::text AS to_status,
    d.dispute_reason_code::text AS reason_code,
    CASE d.opened_by_type
      WHEN 'subject_owner' THEN 'candidate'
      WHEN 'organization_admin' THEN 'organization_member'
      WHEN 'platform_admin' THEN 'platform_admin'
      ELSE 'system'
    END AS actor_type,
    d.opened_by_profile_id AS actor_id,
    NULL::uuid AS related_contradiction_id,
    d.id AS related_dispute_id,
    d.superseding_verification_record_id AS related_verification_record_id,
    NULL::text AS recompute_batch_id,
    COALESCE(d.metadata, '{}'::jsonb) || jsonb_build_object(
      'source_table', 'verification_disputes',
      'backfill_type', 'dispute_opened'
    ) AS metadata
  FROM public.verification_disputes d
  UNION ALL
  SELECT
    d.verification_record_id,
    d.reviewed_at AS occurred_at,
    4 AS source_priority,
    'dispute_updated'::text AS entry_type,
    NULL::text AS from_status,
    NULL::text AS to_status,
    d.dispute_reason_code::text AS reason_code,
    'platform_admin' AS actor_type,
    d.resolved_by_profile_id AS actor_id,
    NULL::uuid AS related_contradiction_id,
    d.id AS related_dispute_id,
    d.superseding_verification_record_id AS related_verification_record_id,
    NULL::text AS recompute_batch_id,
    COALESCE(d.metadata, '{}'::jsonb) || jsonb_build_object(
      'source_table', 'verification_disputes',
      'backfill_type', 'dispute_updated'
    ) AS metadata
  FROM public.verification_disputes d
  WHERE d.reviewed_at IS NOT NULL
  UNION ALL
  SELECT
    d.verification_record_id,
    d.resolved_at AS occurred_at,
    5 AS source_priority,
    'dispute_resolved'::text AS entry_type,
    NULL::text AS from_status,
    CASE d.resolution_action
      WHEN 'revoke' THEN 'revoked'
      WHEN 'downgrade' THEN 'downgraded'
      WHEN 'supersede_with_corrected_record' THEN 'superseded'
      ELSE 'verified'
    END AS to_status,
    d.dispute_reason_code::text AS reason_code,
    'platform_admin' AS actor_type,
    d.resolved_by_profile_id AS actor_id,
    NULL::uuid AS related_contradiction_id,
    d.id AS related_dispute_id,
    d.superseding_verification_record_id AS related_verification_record_id,
    NULL::text AS recompute_batch_id,
    COALESCE(d.metadata, '{}'::jsonb) || jsonb_build_object(
      'source_table', 'verification_disputes',
      'backfill_type', 'dispute_resolved',
      'resolution_action', d.resolution_action
    ) AS metadata
  FROM public.verification_disputes d
  WHERE d.resolved_at IS NOT NULL
),
verification_events AS (
  SELECT
    vr.id AS verification_record_id,
    vr.created_at AS occurred_at,
    0 AS source_priority,
    'record_created'::text AS entry_type,
    NULL::text AS from_status,
    vr.status::text AS to_status,
    NULL::text AS reason_code,
    'system'::text AS actor_type,
    NULL::uuid AS actor_id,
    NULL::uuid AS related_contradiction_id,
    NULL::uuid AS related_dispute_id,
    NULL::uuid AS related_verification_record_id,
    NULL::text AS recompute_batch_id,
    jsonb_build_object(
      'source_table', 'verification_records',
      'backfill_type', 'record_created'
    ) AS metadata
  FROM public.verification_records vr

  UNION ALL

  SELECT
    st.verification_record_id,
    st.created_at AS occurred_at,
    1 AS source_priority,
    CASE
      WHEN st.to_state = 'expired' THEN 'expired'
      WHEN st.to_state = 'downgraded' THEN 'downgraded'
      WHEN st.to_state = 'revoked' THEN 'revoked'
      WHEN st.to_state = 'superseded' THEN 'superseded'
      WHEN st.from_state IN ('expired', 'downgraded', 'contradicted', 'disputed', 'revoked')
        AND st.to_state = 'verified' THEN 'restored'
      WHEN st.to_state = 'pending' THEN 'refresh_requested'
      ELSE 'state_transition'
    END AS entry_type,
    st.from_state::text,
    st.to_state::text,
    st.reason_code::text,
    st.actor_type::text,
    st.actor_id,
    NULL::uuid AS related_contradiction_id,
    NULL::uuid AS related_dispute_id,
    NULL::uuid AS related_verification_record_id,
    NULL::text AS recompute_batch_id,
    COALESCE(st.metadata, '{}'::jsonb) || jsonb_build_object(
      'source_table', 'verification_state_transitions',
      'backfill_type', 'state_transition'
    ) AS metadata
  FROM public.verification_state_transitions st

  UNION ALL

  SELECT
    c.verification_record_id,
    c.detected_at AS occurred_at,
    2 AS source_priority,
    'contradiction_detected'::text AS entry_type,
    NULL::text AS from_status,
    'contradicted'::text AS to_status,
    c.reason_code::text,
    'system'::text AS actor_type,
    NULL::uuid AS actor_id,
    c.id AS related_contradiction_id,
    NULL::uuid AS related_dispute_id,
    c.contradicting_verification_record_id AS related_verification_record_id,
    NULL::text AS recompute_batch_id,
    COALESCE(c.metadata, '{}'::jsonb) || jsonb_build_object(
      'source_table', 'verification_contradictions',
      'backfill_type', 'contradiction_detected',
      'detected_by', c.detected_by,
      'severity', c.severity
    ) AS metadata
  FROM public.verification_contradictions c

  UNION ALL

  SELECT * FROM dispute_events
),
ordered_events AS (
  SELECT
    verification_record_id,
    ROW_NUMBER() OVER (
      PARTITION BY verification_record_id
      ORDER BY occurred_at ASC, source_priority ASC, entry_type ASC
    )::integer AS sequence_number,
    entry_type,
    from_status,
    to_status,
    reason_code,
    actor_type,
    actor_id,
    related_contradiction_id,
    related_dispute_id,
    related_verification_record_id,
    recompute_batch_id,
    metadata,
    occurred_at
  FROM verification_events
)
INSERT INTO public.verification_log_entries (
  verification_record_id,
  sequence_number,
  entry_type,
  from_status,
  to_status,
  reason_code,
  actor_type,
  actor_id,
  related_contradiction_id,
  related_dispute_id,
  related_verification_record_id,
  recompute_batch_id,
  metadata,
  occurred_at
)
SELECT
  ordered.verification_record_id,
  ordered.sequence_number,
  ordered.entry_type,
  ordered.from_status,
  ordered.to_status,
  ordered.reason_code,
  ordered.actor_type,
  ordered.actor_id,
  ordered.related_contradiction_id,
  ordered.related_dispute_id,
  ordered.related_verification_record_id,
  ordered.recompute_batch_id,
  ordered.metadata,
  ordered.occurred_at
FROM ordered_events ordered
WHERE NOT EXISTS (
  SELECT 1
  FROM public.verification_log_entries existing
  WHERE existing.verification_record_id = ordered.verification_record_id
);
