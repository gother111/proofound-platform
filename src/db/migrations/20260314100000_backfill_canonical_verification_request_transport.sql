BEGIN;

INSERT INTO public.verification_records (
  id,
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_slot,
  verification_kind,
  status,
  verifier_principal_type,
  verifier_class,
  verifier_profile_id,
  verifier_email_hash,
  verifier_domain_snapshot,
  integrity_status,
  integrity_reason,
  dispute_state,
  badge_semantics_version,
  risk_signals,
  claim_snapshot,
  source_request_table,
  source_request_id,
  source_response_table,
  source_response_id,
  requested_at,
  expires_at,
  request_expires_at,
  completed_at,
  expired_at,
  revoked_at,
  cancelled_at,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  req.id,
  'individual_profile',
  req.requester_profile_id,
  'skill',
  req.skill_id,
  'skill.attestation',
  CASE
    WHEN req.verifier_source = 'manager' THEN 'skill_attestation_manager'
    ELSE 'skill_attestation_peer'
  END,
  CASE
    WHEN req.status = 'accepted' THEN 'verified'
    WHEN req.status = 'declined' THEN 'declined'
    WHEN req.status = 'expired' THEN 'expired'
    WHEN req.status = 'revoked' THEN 'revoked'
    WHEN req.status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END,
  CASE
    WHEN req.verifier_profile_id IS NULL THEN 'external_email'
    ELSE 'user_account'
  END,
  CASE
    WHEN req.verifier_source = 'manager' THEN 'authenticated_manager'
    WHEN req.verifier_source = 'external' THEN 'authenticated_external'
    ELSE 'authenticated_peer'
  END,
  req.verifier_profile_id,
  encode(extensions.digest(lower(trim(req.verifier_email)), 'sha256'), 'hex'),
  req.verifier_domain_snapshot,
  CASE
    WHEN req.integrity_status = 'clear' THEN 'clear'
    ELSE 'warning'
  END,
  req.integrity_reason,
  'none',
  2,
  COALESCE(req.risk_signals, '{}'::jsonb),
  jsonb_strip_nulls(
    jsonb_build_object(
      'requestTransport', 'skill_verification_request',
      'skillId', req.skill_id,
      'requestKind', req.request_kind,
      'attestationRequest', req.attestation_request
    )
  ),
  'skill_verification_requests',
  req.id,
  'skill_verification_requests',
  req.id,
  req.created_at,
  req.expires_at,
  req.expires_at,
  req.responded_at,
  req.expired_at,
  req.revoked_at,
  req.cancelled_at,
  CASE WHEN req.status = 'accepted' THEN req.responded_at ELSE NULL END,
  jsonb_strip_nulls(
    jsonb_build_object(
      'requestTransport', 'skill_verification_request',
      'requesterEmailSnapshot', req.requester_email_snapshot,
      'verifierEmail', lower(trim(req.verifier_email)),
      'verifierSource', req.verifier_source,
      'verifierRelationship', req.verifier_relationship,
      'requestKind', req.request_kind,
      'attestationRequest', req.attestation_request,
      'attestationResponse', req.attestation_response,
      'message', req.message,
      'capabilityTokenId', req.capability_token_id,
      'requiresAuthenticatedVerifier', req.requires_authenticated_verifier,
      'integrityMeta', COALESCE(req.integrity_meta, '{}'::jsonb),
      'integrityFlaggedAt', req.integrity_flagged_at,
      'responseAuthMethod', req.response_auth_method,
      'responseActorEmail', req.response_actor_email,
      'responseMessage', req.response_message,
      'customRequestId', req.custom_request_id
    )
  ),
  req.created_at,
  COALESCE(req.responded_at, req.cancelled_at, req.revoked_at, req.expired_at, req.created_at)
FROM public.skill_verification_requests req
WHERE NOT EXISTS (
  SELECT 1
  FROM public.verification_records existing
  WHERE existing.id = req.id
     OR (
       existing.source_request_table = 'skill_verification_requests'
       AND existing.source_request_id = req.id
       AND existing.subject_type = 'skill'
       AND existing.subject_id = req.skill_id
     )
);

INSERT INTO public.verification_records (
  id,
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_slot,
  verification_kind,
  status,
  verifier_principal_type,
  verifier_class,
  verifier_profile_id,
  verifier_email_hash,
  verifier_domain_snapshot,
  integrity_status,
  integrity_reason,
  dispute_state,
  badge_semantics_version,
  risk_signals,
  claim_snapshot,
  source_request_table,
  source_request_id,
  source_response_table,
  source_response_id,
  requested_at,
  expires_at,
  request_expires_at,
  completed_at,
  expired_at,
  revoked_at,
  cancelled_at,
  failure_code,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  req.id,
  'individual_profile',
  req.requester_profile_id,
  'impact_story',
  req.impact_story_id,
  'impact_story.attestation',
  'impact_attestation',
  CASE
    WHEN req.status = 'accepted' THEN 'verified'
    WHEN req.status = 'declined' THEN 'declined'
    WHEN req.status = 'expired' THEN 'expired'
    WHEN req.status = 'failed' THEN 'failed'
    WHEN req.status = 'revoked' THEN 'revoked'
    WHEN req.status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END,
  CASE
    WHEN req.verifier_profile_id IS NULL THEN 'external_email'
    ELSE 'user_account'
  END,
  'authenticated_external',
  req.verifier_profile_id,
  encode(extensions.digest(lower(trim(req.verifier_email)), 'sha256'), 'hex'),
  req.verifier_domain_snapshot,
  CASE
    WHEN req.integrity_status = 'clear' THEN 'clear'
    ELSE 'warning'
  END,
  req.integrity_reason,
  'none',
  2,
  COALESCE(req.risk_signals, '{}'::jsonb),
  COALESCE(req.claim_snapshot, '{}'::jsonb) || jsonb_build_object(
    'requestTransport', 'impact_verification_request',
    'impactStoryId', req.impact_story_id
  ),
  'impact_story_verification_requests',
  req.id,
  'impact_story_verification_requests',
  req.id,
  req.created_at,
  req.expires_at,
  req.expires_at,
  req.responded_at,
  req.expired_at,
  req.revoked_at,
  req.cancelled_at,
  req.email_error,
  CASE WHEN req.status = 'accepted' THEN req.responded_at ELSE NULL END,
  jsonb_strip_nulls(
    jsonb_build_object(
      'requestTransport', 'impact_verification_request',
      'requesterEmailSnapshot', req.requester_email_snapshot,
      'verifierEmail', lower(trim(req.verifier_email)),
      'verifierName', req.verifier_name,
      'verifierRelationship', req.verifier_relationship,
      'message', req.message,
      'claimSnapshot', COALESCE(req.claim_snapshot, '{}'::jsonb),
      'capabilityTokenId', req.capability_token_id,
      'emailSent', CASE WHEN req.email_error IS NULL THEN true ELSE false END,
      'emailError', req.email_error,
      'requiresAuthenticatedVerifier', req.requires_authenticated_verifier,
      'integrityMeta', COALESCE(req.integrity_meta, '{}'::jsonb),
      'integrityFlaggedAt', req.integrity_flagged_at,
      'responseAuthMethod', req.response_auth_method,
      'responseActorEmail', req.response_actor_email,
      'responseMessage', req.response_message
    )
  ),
  req.created_at,
  COALESCE(req.updated_at, req.responded_at, req.cancelled_at, req.revoked_at, req.expired_at, req.created_at)
FROM public.impact_story_verification_requests req
WHERE NOT EXISTS (
  SELECT 1
  FROM public.verification_records existing
  WHERE existing.id = req.id
     OR (
       existing.source_request_table = 'impact_story_verification_requests'
       AND existing.source_request_id = req.id
       AND existing.subject_type = 'impact_story'
       AND existing.subject_id = req.impact_story_id
     )
);

COMMIT;
