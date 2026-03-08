-- Block 7: Canonical verification policy and badge semantics
-- Expands canonical verification records into a richer trust policy model.

ALTER TABLE public.verification_records
  ADD COLUMN IF NOT EXISTS verification_slot TEXT,
  ADD COLUMN IF NOT EXISTS verifier_class TEXT,
  ADD COLUMN IF NOT EXISTS dispute_state TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS badge_semantics_version INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS superseded_by_verification_id UUID,
  ADD COLUMN IF NOT EXISTS downgraded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contradicted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contradicted_by_verification_id UUID,
  ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

ALTER TABLE public.verification_records
  DROP CONSTRAINT IF EXISTS verification_records_verification_kind_check,
  DROP CONSTRAINT IF EXISTS verification_records_status_check,
  DROP CONSTRAINT IF EXISTS verification_records_integrity_status_check;

UPDATE public.verification_records
SET verification_kind = CASE
    WHEN verification_kind = 'skill_peer' THEN 'skill_attestation_peer'
    WHEN verification_kind = 'skill_manager' THEN 'skill_attestation_manager'
    WHEN verification_kind = 'custom_bundle' THEN 'impact_attestation'
    WHEN verification_kind = 'impact_story' THEN 'impact_attestation'
    WHEN verification_kind = 'linkedin' THEN
      CASE
        WHEN lower(COALESCE(metadata ->> 'hasIdentityVerification', 'false')) = 'true'
          OR lower(COALESCE(metadata ->> 'verificationLevel', '')) = 'identity'
          OR lower(COALESCE(claim_snapshot ->> 'hasIdentityVerification', 'false')) = 'true'
        THEN 'linkedin_identity'
        ELSE 'linkedin_workplace'
      END
    WHEN verification_kind = 'veriff' THEN 'veriff_identity'
    WHEN verification_kind = 'org_registry' THEN 'org_registry_manual'
    WHEN verification_kind = 'manual' THEN
      CASE
        WHEN owner_type = 'organization' OR subject_type = 'organization'
          THEN 'platform_manual_review'
        ELSE 'impact_attestation'
      END
    ELSE verification_kind
  END,
  status = CASE
    WHEN status = 'accepted' THEN 'verified'
    ELSE status
  END,
  integrity_status = CASE
    WHEN integrity_status = 'flagged' THEN 'warning'
    ELSE integrity_status
  END;

UPDATE public.verification_records
SET verification_slot = CASE
    WHEN verification_kind IN ('veriff_identity', 'linkedin_identity') THEN 'individual.identity'
    WHEN verification_kind IN ('linkedin_workplace', 'work_email') THEN 'individual.workplace'
    WHEN verification_kind IN ('skill_attestation_peer', 'skill_attestation_manager') THEN 'skill.attestation'
    WHEN verification_kind = 'impact_attestation' AND subject_type = 'impact_story' THEN 'impact_story.attestation'
    WHEN verification_kind = 'impact_attestation' THEN 'artifact.attestation'
    WHEN verification_kind = 'org_domain' THEN 'organization.domain'
    WHEN verification_kind IN ('org_registry_manual', 'platform_manual_review') THEN 'organization.platform_review'
    ELSE verification_slot
  END,
  verifier_class = COALESCE(
    verifier_class,
    CASE
      WHEN verification_kind IN ('veriff_identity', 'linkedin_identity') THEN 'system_provider'
      WHEN verification_kind IN ('linkedin_workplace', 'work_email', 'org_domain') THEN 'system_signal'
      WHEN verification_kind = 'skill_attestation_manager' THEN 'authenticated_manager'
      WHEN verification_kind = 'skill_attestation_peer' THEN 'authenticated_peer'
      WHEN verification_kind = 'impact_attestation' THEN 'authenticated_external'
      WHEN verification_kind IN ('org_registry_manual', 'platform_manual_review') THEN 'manual_platform_reviewer'
      ELSE 'system_signal'
    END
  ),
  dispute_state = COALESCE(dispute_state, 'none'),
  badge_semantics_version = COALESCE(badge_semantics_version, 2),
  requested_at = COALESCE(requested_at, created_at),
  last_refreshed_at = COALESCE(last_refreshed_at, verified_at),
  expires_at = COALESCE(
    expires_at,
    CASE
      WHEN status = 'verified' AND verification_kind IN ('work_email', 'linkedin_workplace', 'org_domain')
        THEN COALESCE(last_refreshed_at, verified_at, completed_at, updated_at) + INTERVAL '12 months'
      WHEN status = 'verified' AND verification_kind IN ('veriff_identity', 'linkedin_identity', 'org_registry_manual', 'platform_manual_review')
        THEN COALESCE(last_refreshed_at, verified_at, completed_at, updated_at) + INTERVAL '24 months'
      ELSE NULL
    END
  );

ALTER TABLE public.verification_records
  ADD CONSTRAINT verification_records_verification_kind_check
    CHECK (
      verification_kind IN (
        'veriff_identity',
        'linkedin_identity',
        'linkedin_workplace',
        'work_email',
        'skill_attestation_peer',
        'skill_attestation_manager',
        'impact_attestation',
        'org_domain',
        'org_registry_manual',
        'platform_manual_review'
      )
    ),
  ADD CONSTRAINT verification_records_status_check
    CHECK (
      status IN (
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
  ADD CONSTRAINT verification_records_integrity_status_check
    CHECK (integrity_status IN ('unknown', 'clear', 'warning', 'contradicted')),
  ADD CONSTRAINT verification_records_verification_slot_check
    CHECK (
      verification_slot IS NULL OR verification_slot IN (
        'individual.identity',
        'individual.workplace',
        'skill.attestation',
        'impact_story.attestation',
        'artifact.attestation',
        'organization.domain',
        'organization.platform_review'
      )
    ),
  ADD CONSTRAINT verification_records_verifier_class_check
    CHECK (
      verifier_class IS NULL OR verifier_class IN (
        'system_provider',
        'system_signal',
        'authenticated_manager',
        'authenticated_peer',
        'authenticated_external',
        'manual_platform_reviewer'
      )
    ),
  ADD CONSTRAINT verification_records_dispute_state_check
    CHECK (
      dispute_state IN (
        'none',
        'open',
        'under_review',
        'resolved_upheld',
        'resolved_downgraded',
        'resolved_revoked'
      )
    );

CREATE INDEX IF NOT EXISTS idx_verification_records_slot
  ON public.verification_records(owner_type, owner_id, verification_slot, updated_at DESC);

ALTER TABLE public.verification_state_transitions
  DROP CONSTRAINT IF EXISTS verification_state_transitions_from_state_check,
  DROP CONSTRAINT IF EXISTS verification_state_transitions_to_state_check;

UPDATE public.verification_state_transitions
SET
  from_state = CASE WHEN from_state = 'accepted' THEN 'verified' ELSE from_state END,
  to_state = CASE WHEN to_state = 'accepted' THEN 'verified' ELSE to_state END;

ALTER TABLE public.verification_state_transitions
  ADD CONSTRAINT verification_state_transitions_from_state_check
    CHECK (
      from_state IS NULL OR from_state IN (
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
  ADD CONSTRAINT verification_state_transitions_to_state_check
    CHECK (
      to_state IN (
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
    );

CREATE TABLE IF NOT EXISTS public.verification_contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID NOT NULL REFERENCES public.verification_records(id) ON DELETE CASCADE,
  contradicting_verification_record_id UUID REFERENCES public.verification_records(id) ON DELETE SET NULL,
  contradiction_type TEXT NOT NULL CHECK (
    contradiction_type IN (
      'identity_mismatch',
      'workplace_mismatch',
      'verifier_identity_mismatch',
      'relationship_mismatch',
      'subject_chronology_mismatch',
      'artifact_authenticity_concern',
      'org_domain_control_mismatch',
      'platform_review_evidence_invalidated'
    )
  ),
  severity TEXT NOT NULL DEFAULT 'material' CHECK (severity IN ('warning', 'material')),
  detected_by TEXT NOT NULL CHECK (
    detected_by IN ('system', 'profile_change', 'verifier_change', 'admin_review', 'imported_update')
  ),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved')),
  reason_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verification_contradictions_verification_idx
  ON public.verification_contradictions(verification_record_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS verification_contradictions_contradicting_idx
  ON public.verification_contradictions(contradicting_verification_record_id);

CREATE TABLE IF NOT EXISTS public.verification_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_record_id UUID NOT NULL REFERENCES public.verification_records(id) ON DELETE CASCADE,
  dispute_state TEXT NOT NULL DEFAULT 'open' CHECK (
    dispute_state IN (
      'open',
      'under_review',
      'resolved_upheld',
      'resolved_downgraded',
      'resolved_revoked'
    )
  ),
  dispute_reason_code TEXT NOT NULL CHECK (
    dispute_reason_code IN (
      'wrong_person',
      'wrong_organization',
      'outdated_employment_or_role',
      'verifier_misattributed',
      'artifact_forged_or_incorrect',
      'unauthorized_or_abusive_request',
      'admin_review_error'
    )
  ),
  opened_by_type TEXT NOT NULL CHECK (
    opened_by_type IN ('subject_owner', 'organization_admin', 'original_verifier', 'platform_admin')
  ),
  opened_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  opened_by_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_action TEXT CHECK (
    resolution_action IN (
      'uphold',
      'request_refresh',
      'downgrade',
      'revoke',
      'supersede_with_corrected_record'
    )
  ),
  resolved_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  superseding_verification_record_id UUID REFERENCES public.verification_records(id) ON DELETE SET NULL,
  note TEXT,
  evidence_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS verification_disputes_verification_idx
  ON public.verification_disputes(verification_record_id, opened_at DESC);

CREATE INDEX IF NOT EXISTS verification_disputes_state_idx
  ON public.verification_disputes(dispute_state, updated_at DESC);

DO $$
BEGIN
  IF to_regprocedure('public.handle_updated_at()') IS NOT NULL THEN
    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_verification_contradictions ON public.verification_contradictions;
      CREATE TRIGGER set_updated_at_verification_contradictions
      BEFORE UPDATE ON public.verification_contradictions
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';

    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_verification_disputes ON public.verification_disputes;
      CREATE TRIGGER set_updated_at_verification_disputes
      BEFORE UPDATE ON public.verification_disputes
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';
  END IF;
END $$;
