-- Block 1: Canonical contracts and schema foundation
-- Adds canonical proof, pack, verification, and match audit persistence.

CREATE TABLE IF NOT EXISTS public.proof_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('individual_profile', 'organization')),
  owner_id UUID NOT NULL,
  subject_type TEXT NOT NULL CHECK (
    subject_type IN (
      'individual_profile',
      'skill',
      'project',
      'impact_story',
      'experience',
      'education',
      'volunteering',
      'organization'
    )
  ),
  subject_id UUID,
  artifact_kind TEXT NOT NULL CHECK (
    artifact_kind IN ('link', 'document', 'image', 'video', 'credential', 'reference', 'assessment', 'other')
  ),
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  storage_path TEXT,
  mime_type TEXT,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  visibility TEXT NOT NULL DEFAULT 'owner_only' CHECK (
    visibility IN ('public', 'link_only', 'matched_org', 'owner_only')
  ),
  reveal_gate TEXT NOT NULL DEFAULT 'none' CHECK (
    reveal_gate IN ('none', 'match_exists', 'conversation_started')
  ),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legacy_source_table TEXT,
  legacy_source_id UUID,
  legacy_source_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proof_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('individual_profile', 'organization')),
  owner_id UUID NOT NULL,
  pack_kind TEXT NOT NULL CHECK (
    pack_kind IN ('profile_export', 'organization_export', 'verification_bundle')
  ),
  title TEXT NOT NULL,
  summary TEXT,
  visibility TEXT NOT NULL DEFAULT 'owner_only' CHECK (
    visibility IN ('public', 'link_only', 'matched_org', 'owner_only')
  ),
  reveal_gate TEXT NOT NULL DEFAULT 'none' CHECK (
    reveal_gate IN ('none', 'match_exists', 'conversation_started')
  ),
  share_token_hash TEXT,
  share_expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  legacy_source_table TEXT,
  legacy_source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proof_pack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.proof_packs(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES public.proof_artifacts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  included_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('individual_profile', 'organization')),
  owner_id UUID NOT NULL,
  subject_type TEXT NOT NULL CHECK (
    subject_type IN (
      'individual_profile',
      'skill',
      'project',
      'impact_story',
      'experience',
      'education',
      'volunteering',
      'organization'
    )
  ),
  subject_id UUID NOT NULL,
  proof_artifact_id UUID REFERENCES public.proof_artifacts(id) ON DELETE SET NULL,
  verification_kind TEXT NOT NULL CHECK (
    verification_kind IN (
      'skill_peer',
      'skill_manager',
      'custom_bundle',
      'impact_story',
      'work_email',
      'linkedin',
      'veriff',
      'org_registry',
      'org_domain',
      'manual'
    )
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled', 'failed')
  ),
  verifier_principal_type TEXT NOT NULL CHECK (
    verifier_principal_type IN ('user_account', 'organization', 'external_email', 'platform_admin', 'system')
  ),
  verifier_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verifier_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  verifier_email_hash TEXT,
  verifier_domain_snapshot TEXT,
  integrity_status TEXT NOT NULL DEFAULT 'unknown' CHECK (
    integrity_status IN ('unknown', 'clear', 'flagged')
  ),
  integrity_reason TEXT,
  risk_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
  claim_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_request_table TEXT,
  source_request_id UUID,
  source_response_table TEXT,
  source_response_id UUID,
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_artifacts_owner
  ON public.proof_artifacts(owner_type, owner_id);

CREATE INDEX IF NOT EXISTS idx_proof_artifacts_subject
  ON public.proof_artifacts(subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_proof_artifacts_visibility
  ON public.proof_artifacts(visibility, reveal_gate);

CREATE UNIQUE INDEX IF NOT EXISTS idx_proof_artifacts_legacy_source_unique
  ON public.proof_artifacts(legacy_source_table, legacy_source_id, COALESCE(legacy_source_path, ''));

CREATE INDEX IF NOT EXISTS idx_proof_packs_owner
  ON public.proof_packs(owner_type, owner_id);

CREATE INDEX IF NOT EXISTS idx_proof_packs_visibility
  ON public.proof_packs(visibility, reveal_gate);

CREATE INDEX IF NOT EXISTS idx_proof_packs_share_token_hash
  ON public.proof_packs(share_token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS idx_proof_packs_legacy_source_unique
  ON public.proof_packs(legacy_source_table, legacy_source_id);

CREATE INDEX IF NOT EXISTS idx_proof_pack_items_pack
  ON public.proof_pack_items(pack_id, position);

CREATE INDEX IF NOT EXISTS idx_proof_pack_items_artifact
  ON public.proof_pack_items(artifact_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_proof_pack_items_pack_artifact_unique
  ON public.proof_pack_items(pack_id, artifact_id);

CREATE INDEX IF NOT EXISTS idx_verification_records_owner
  ON public.verification_records(owner_type, owner_id);

CREATE INDEX IF NOT EXISTS idx_verification_records_subject
  ON public.verification_records(subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_verification_records_artifact
  ON public.verification_records(proof_artifact_id);

CREATE INDEX IF NOT EXISTS idx_verification_records_status_kind
  ON public.verification_records(status, verification_kind);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_records_source_subject_unique
  ON public.verification_records(source_request_table, source_request_id, subject_type, subject_id);

DO $$
BEGIN
  IF to_regprocedure('public.handle_updated_at()') IS NOT NULL THEN
    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_proof_artifacts ON public.proof_artifacts;
      CREATE TRIGGER set_updated_at_proof_artifacts
      BEFORE UPDATE ON public.proof_artifacts
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';

    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_proof_packs ON public.proof_packs;
      CREATE TRIGGER set_updated_at_proof_packs
      BEFORE UPDATE ON public.proof_packs
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';

    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_proof_pack_items ON public.proof_pack_items;
      CREATE TRIGGER set_updated_at_proof_pack_items
      BEFORE UPDATE ON public.proof_pack_items
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';

    EXECUTE '
      DROP TRIGGER IF EXISTS set_updated_at_verification_records ON public.verification_records;
      CREATE TRIGGER set_updated_at_verification_records
      BEFORE UPDATE ON public.verification_records
      FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ';
  END IF;
END $$;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS score_version TEXT,
  ADD COLUMN IF NOT EXISTS inputs_hash TEXT,
  ADD COLUMN IF NOT EXISTS reason_codes TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS matches_score_version_idx
  ON public.matches(score_version);

CREATE INDEX IF NOT EXISTS matches_generated_at_idx
  ON public.matches(generated_at);

INSERT INTO public.proof_artifacts (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  artifact_kind,
  title,
  description,
  source_url,
  storage_path,
  issued_at,
  expires_at,
  visibility,
  reveal_gate,
  metadata,
  legacy_source_table,
  legacy_source_id,
  legacy_source_path,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  sp.profile_id,
  'skill',
  sp.skill_id,
  CASE sp.proof_type
    WHEN 'certification' THEN 'credential'
    WHEN 'document' THEN 'document'
    WHEN 'media' THEN 'image'
    WHEN 'reference' THEN 'reference'
    WHEN 'link' THEN 'link'
    ELSE 'other'
  END,
  sp.title,
  sp.description,
  sp.url,
  sp.file_path,
  CASE WHEN sp.issued_date IS NOT NULL THEN sp.issued_date::timestamp AT TIME ZONE 'UTC' ELSE NULL END,
  CASE WHEN sp.expires_date IS NOT NULL THEN sp.expires_date::timestamp AT TIME ZONE 'UTC' ELSE NULL END,
  CASE COALESCE(sp.metadata->>'visibility', 'owner_only')
    WHEN 'public' THEN 'public'
    WHEN 'match-only' THEN 'matched_org'
    WHEN 'match_only' THEN 'matched_org'
    WHEN 'network' THEN 'link_only'
    WHEN 'network_only' THEN 'link_only'
    ELSE 'owner_only'
  END,
  CASE COALESCE(sp.metadata->>'visibility', 'owner_only')
    WHEN 'match-only' THEN 'match_exists'
    WHEN 'match_only' THEN 'match_exists'
    ELSE 'none'
  END,
  COALESCE(sp.metadata, '{}'::jsonb),
  'skill_proofs',
  sp.id,
  NULL,
  sp.created_at,
  sp.updated_at
FROM public.skill_proofs sp
ON CONFLICT DO NOTHING;

INSERT INTO public.proof_artifacts (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  artifact_kind,
  title,
  description,
  source_url,
  storage_path,
  visibility,
  reveal_gate,
  metadata,
  legacy_source_table,
  legacy_source_id,
  legacy_source_path,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  p.user_id,
  'project',
  p.id,
  CASE COALESCE(artifact.value->>'type', artifact.value->>'kind', 'other')
    WHEN 'link' THEN 'link'
    WHEN 'document' THEN 'document'
    WHEN 'image' THEN 'image'
    WHEN 'video' THEN 'video'
    WHEN 'credential' THEN 'credential'
    WHEN 'reference' THEN 'reference'
    WHEN 'assessment' THEN 'assessment'
    ELSE 'other'
  END,
  COALESCE(artifact.value->>'title', artifact.value->>'name', 'Project artifact'),
  artifact.value->>'description',
  COALESCE(artifact.value->>'url', artifact.value->>'source_url'),
  COALESCE(artifact.value->>'path', artifact.value->>'file_path', artifact.value->>'storage_path'),
  CASE COALESCE(p.visibility, 'private')
    WHEN 'public' THEN 'public'
    WHEN 'network' THEN 'link_only'
    ELSE 'owner_only'
  END,
  'none',
  artifact.value,
  'projects',
  p.id,
  FORMAT('artifacts[%s]', artifact.ordinality - 1),
  p.created_at,
  p.updated_at
FROM public.projects p
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(COALESCE(p.artifacts, '[]'::jsonb)) = 'array' THEN COALESCE(p.artifacts, '[]'::jsonb)
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS artifact(value, ordinality)
ON CONFLICT DO NOTHING;

INSERT INTO public.proof_artifacts (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  artifact_kind,
  title,
  description,
  source_url,
  storage_path,
  visibility,
  reveal_gate,
  metadata,
  legacy_source_table,
  legacy_source_id,
  legacy_source_path,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  i.user_id,
  'impact_story',
  i.id,
  CASE COALESCE(artifact.value->>'type', artifact.value->>'kind', 'other')
    WHEN 'link' THEN 'link'
    WHEN 'document' THEN 'document'
    WHEN 'image' THEN 'image'
    WHEN 'video' THEN 'video'
    WHEN 'credential' THEN 'credential'
    WHEN 'reference' THEN 'reference'
    WHEN 'assessment' THEN 'assessment'
    ELSE 'other'
  END,
  COALESCE(artifact.value->>'title', artifact.value->>'name', 'Impact artifact'),
  artifact.value->>'description',
  COALESCE(artifact.value->>'url', artifact.value->>'source_url'),
  COALESCE(artifact.value->>'path', artifact.value->>'file_path', artifact.value->>'storage_path'),
  'owner_only',
  'none',
  artifact.value,
  'impact_stories',
  i.id,
  FORMAT('supporting_artifacts[%s]', artifact.ordinality - 1),
  i.created_at,
  i.updated_at
FROM public.impact_stories i
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(COALESCE(i.supporting_artifacts, '[]'::jsonb)) = 'array' THEN COALESCE(i.supporting_artifacts, '[]'::jsonb)
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS artifact(value, ordinality)
ON CONFLICT DO NOTHING;

INSERT INTO public.proof_packs (
  owner_type,
  owner_id,
  pack_kind,
  title,
  visibility,
  reveal_gate,
  share_token_hash,
  share_expires_at,
  created_by,
  metadata,
  legacy_source_table,
  legacy_source_id,
  created_at,
  updated_at
)
SELECT
  CASE WHEN ps.profile_type = 'organization' THEN 'organization' ELSE 'individual_profile' END,
  CASE WHEN ps.profile_type = 'organization' THEN ps.org_id ELSE ps.user_id END,
  'profile_export',
  CASE WHEN ps.profile_type = 'organization' THEN 'Organization Profile Export' ELSE 'Profile Export' END,
  'link_only',
  'none',
  encode(digest(ps.share_token, 'sha256'), 'hex'),
  ps.expires_at,
  ps.user_id,
  jsonb_build_object(
    'fields', COALESCE(ps.fields, '{}'::jsonb),
    'theme', ps.theme,
    'format', ps.format,
    'profileType', COALESCE(ps.profile_type, 'individual'),
    'orgId', ps.org_id
  ),
  'profile_snippets',
  ps.id,
  ps.created_at,
  ps.updated_at
FROM public.profile_snippets ps
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_records (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_kind,
  status,
  verifier_principal_type,
  verifier_profile_id,
  verifier_email_hash,
  verifier_domain_snapshot,
  integrity_status,
  integrity_reason,
  risk_signals,
  claim_snapshot,
  source_request_table,
  source_request_id,
  source_response_table,
  source_response_id,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  svr.requester_profile_id,
  'skill',
  svr.skill_id,
  CASE svr.verifier_source
    WHEN 'manager' THEN 'skill_manager'
    WHEN 'peer' THEN 'skill_peer'
    ELSE 'manual'
  END,
  CASE svr.status
    WHEN 'accepted' THEN 'accepted'
    WHEN 'declined' THEN 'declined'
    WHEN 'expired' THEN 'expired'
    ELSE 'pending'
  END,
  CASE WHEN svr.verifier_profile_id IS NOT NULL THEN 'user_account' ELSE 'external_email' END,
  svr.verifier_profile_id,
  CASE WHEN svr.verifier_email IS NOT NULL THEN encode(digest(lower(svr.verifier_email), 'sha256'), 'hex') ELSE NULL END,
  svr.verifier_domain_snapshot,
  CASE COALESCE(svr.integrity_status, 'clear')
    WHEN 'flagged' THEN 'flagged'
    ELSE 'clear'
  END,
  svr.integrity_reason,
  COALESCE(svr.risk_signals, '{}'::jsonb),
  jsonb_build_object('message', svr.message),
  'skill_verification_requests',
  svr.id,
  CASE WHEN svr.responded_at IS NOT NULL THEN 'skill_verification_requests' ELSE NULL END,
  CASE WHEN svr.responded_at IS NOT NULL THEN svr.id ELSE NULL END,
  CASE WHEN svr.status = 'accepted' THEN svr.responded_at ELSE NULL END,
  jsonb_build_object(
    'customRequestId', svr.custom_request_id,
    'requiresAuthenticatedVerifier', svr.requires_authenticated_verifier
  ),
  svr.created_at,
  COALESCE(svr.responded_at, svr.created_at)
FROM public.skill_verification_requests svr
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_records (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_kind,
  status,
  verifier_principal_type,
  verifier_profile_id,
  verifier_email_hash,
  verifier_domain_snapshot,
  integrity_status,
  integrity_reason,
  risk_signals,
  claim_snapshot,
  source_request_table,
  source_request_id,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  r.requester_profile_id,
  CASE i.artifact_type
    WHEN 'skill' THEN 'skill'
    WHEN 'project' THEN 'project'
    WHEN 'impact_story' THEN 'impact_story'
    WHEN 'education' THEN 'education'
    WHEN 'volunteering' THEN 'volunteering'
    ELSE 'experience'
  END,
  i.artifact_id,
  'custom_bundle',
  CASE r.status
    WHEN 'accepted' THEN 'accepted'
    WHEN 'declined' THEN 'declined'
    WHEN 'expired' THEN 'expired'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END,
  CASE WHEN r.verifier_profile_id IS NOT NULL THEN 'user_account' ELSE 'external_email' END,
  r.verifier_profile_id,
  encode(digest(lower(r.verifier_email), 'sha256'), 'hex'),
  split_part(lower(r.verifier_email), '@', 2),
  'unknown',
  NULL,
  '{}'::jsonb,
  jsonb_build_object('displayLabel', i.display_label, 'artifactType', i.artifact_type),
  'custom_verification_requests',
  r.id,
  CASE WHEN r.status = 'accepted' THEN r.responded_at ELSE NULL END,
  jsonb_build_object(
    'itemStatus', i.status,
    'verifierRelationship', r.verifier_relationship,
    'message', r.message
  ),
  r.created_at,
  COALESCE(r.responded_at, r.updated_at, r.created_at)
FROM public.custom_verification_request_items i
INNER JOIN public.custom_verification_requests r ON r.id = i.request_id
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_records (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_kind,
  status,
  verifier_principal_type,
  verifier_profile_id,
  verifier_email_hash,
  verifier_domain_snapshot,
  integrity_status,
  integrity_reason,
  risk_signals,
  claim_snapshot,
  source_request_table,
  source_request_id,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  req.requester_profile_id,
  'impact_story',
  req.impact_story_id,
  'impact_story',
  CASE req.status
    WHEN 'accepted' THEN 'accepted'
    WHEN 'declined' THEN 'declined'
    WHEN 'expired' THEN 'expired'
    WHEN 'failed' THEN 'failed'
    ELSE 'pending'
  END,
  CASE WHEN req.verifier_profile_id IS NOT NULL THEN 'user_account' ELSE 'external_email' END,
  req.verifier_profile_id,
  CASE WHEN req.verifier_email IS NOT NULL THEN encode(digest(lower(req.verifier_email), 'sha256'), 'hex') ELSE NULL END,
  req.verifier_domain_snapshot,
  CASE COALESCE(req.integrity_status, 'clear')
    WHEN 'flagged' THEN 'flagged'
    ELSE 'clear'
  END,
  req.integrity_reason,
  COALESCE(req.risk_signals, '{}'::jsonb),
  COALESCE(req.claim_snapshot, '{}'::jsonb),
  'impact_story_verification_requests',
  req.id,
  CASE WHEN req.status = 'accepted' THEN req.responded_at ELSE NULL END,
  jsonb_build_object(
    'verifierName', req.verifier_name,
    'verifierRelationship', req.verifier_relationship,
    'message', req.message
  ),
  req.created_at,
  COALESCE(req.responded_at, req.updated_at, req.created_at)
FROM public.impact_story_verification_requests req
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_records (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_kind,
  status,
  verifier_principal_type,
  verifier_profile_id,
  verifier_email_hash,
  claim_snapshot,
  source_request_table,
  source_request_id,
  source_response_table,
  source_response_id,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  vr.profile_id,
  CASE vr.claim_type
    WHEN 'skill' THEN 'skill'
    WHEN 'education' THEN 'education'
    WHEN 'project' THEN 'project'
    ELSE 'experience'
  END,
  vr.profile_id,
  'manual',
  CASE vr.status
    WHEN 'verified' THEN 'accepted'
    WHEN 'declined' THEN 'declined'
    WHEN 'expired' THEN 'expired'
    WHEN 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END,
  'external_email',
  NULL,
  CASE WHEN vr.verifier_email IS NOT NULL THEN encode(digest(lower(vr.verifier_email), 'sha256'), 'hex') ELSE NULL END,
  jsonb_build_object(
    'claimType', vr.claim_type,
    'claimData', vr.claim_data,
    'verifierName', vr.verifier_name,
    'verifierRelationship', vr.verifier_relationship
  ),
  'verification_requests',
  vr.id,
  CASE WHEN resp.id IS NOT NULL THEN 'verification_responses' ELSE NULL END,
  resp.id,
  CASE WHEN vr.status = 'verified' THEN vr.responded_at ELSE NULL END,
  jsonb_build_object(
    'visibility', vr.visibility,
    'showVerifierName', vr.show_verifier_name,
    'responseType', resp.response_type,
    'responseReason', resp.reason
  ),
  vr.created_at,
  COALESCE(vr.responded_at, vr.updated_at, vr.created_at)
FROM public.verification_requests vr
LEFT JOIN LATERAL (
  SELECT id, response_type, reason
  FROM public.verification_responses resp
  WHERE resp.request_id = vr.id
  ORDER BY resp.responded_at DESC
  LIMIT 1
) resp ON TRUE
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_records (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_kind,
  status,
  verifier_principal_type,
  verifier_profile_id,
  verifier_domain_snapshot,
  integrity_status,
  claim_snapshot,
  source_request_table,
  source_request_id,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'organization',
  ov.org_id,
  'organization',
  ov.org_id,
  CASE ov.verification_type
    WHEN 'registry' THEN 'org_registry'
    WHEN 'manual' THEN 'manual'
    ELSE 'org_domain'
  END,
  CASE ov.status
    WHEN 'verified' THEN 'accepted'
    WHEN 'failed' THEN 'failed'
    WHEN 'expired' THEN 'expired'
    ELSE 'pending'
  END,
  CASE WHEN ov.verified_by IS NOT NULL THEN 'user_account' ELSE 'system' END,
  ov.verified_by,
  ov.domain,
  'unknown',
  jsonb_build_object(
    'verificationType', ov.verification_type,
    'domain', ov.domain,
    'registryNumber', ov.registry_number
  ),
  'org_verification',
  ov.id,
  ov.verified_at,
  COALESCE(ov.metadata, '{}'::jsonb),
  ov.created_at,
  COALESCE(ov.verified_at, ov.created_at)
FROM public.org_verification ov
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_records (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_kind,
  status,
  verifier_principal_type,
  integrity_status,
  source_request_table,
  source_request_id,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  ip.user_id,
  'individual_profile',
  ip.user_id,
  'work_email',
  CASE
    WHEN ip.work_email_verified THEN 'accepted'
    WHEN ip.verification_method = 'work_email' AND ip.verification_status = 'failed' THEN 'failed'
    WHEN ip.verification_method = 'work_email' AND ip.verification_status = 'pending' THEN 'pending'
    ELSE 'pending'
  END,
  'system',
  CASE WHEN ip.work_email_verified THEN 'clear' ELSE 'unknown' END,
  'individual_profiles.work_email',
  ip.user_id,
  ip.work_email_verified_at,
  jsonb_build_object('workEmailOrgId', ip.work_email_org_id),
  COALESCE(ip.work_email_verified_at, ip.joined_date, NOW()),
  COALESCE(ip.work_email_verified_at, ip.joined_date, NOW())
FROM public.individual_profiles ip
WHERE ip.work_email IS NOT NULL
   OR ip.work_email_verified = TRUE
   OR ip.verification_method = 'work_email'
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_records (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_kind,
  status,
  verifier_principal_type,
  integrity_status,
  source_request_table,
  source_request_id,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  ip.user_id,
  'individual_profile',
  ip.user_id,
  'linkedin',
  CASE ip.linkedin_verification_status
    WHEN 'verified' THEN 'accepted'
    WHEN 'failed' THEN 'failed'
    WHEN 'pending' THEN 'pending'
    ELSE 'pending'
  END,
  'system',
  CASE WHEN ip.linkedin_verification_status = 'verified' THEN 'clear' ELSE 'unknown' END,
  'individual_profiles.linkedin',
  ip.user_id,
  ip.linkedin_verified_at,
  COALESCE(ip.linkedin_verification_data, '{}'::jsonb),
  COALESCE(ip.linkedin_verified_at, ip.joined_date, NOW()),
  COALESCE(ip.linkedin_verified_at, ip.joined_date, NOW())
FROM public.individual_profiles ip
WHERE ip.linkedin_profile_url IS NOT NULL
   OR ip.linkedin_verification_status <> 'unverified'
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_records (
  owner_type,
  owner_id,
  subject_type,
  subject_id,
  verification_kind,
  status,
  verifier_principal_type,
  integrity_status,
  source_request_table,
  source_request_id,
  verified_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  'individual_profile',
  ip.user_id,
  'individual_profile',
  ip.user_id,
  'veriff',
  CASE ip.verification_status
    WHEN 'verified' THEN 'accepted'
    WHEN 'failed' THEN 'failed'
    WHEN 'pending' THEN 'pending'
    ELSE 'pending'
  END,
  'system',
  CASE WHEN ip.verification_status = 'verified' THEN 'clear' ELSE 'unknown' END,
  'individual_profiles.veriff',
  ip.user_id,
  ip.verified_at,
  jsonb_build_object('veriffSessionId', ip.veriff_session_id),
  COALESCE(ip.verified_at, ip.joined_date, NOW()),
  COALESCE(ip.verified_at, ip.joined_date, NOW())
FROM public.individual_profiles ip
WHERE ip.veriff_session_id IS NOT NULL
   OR ip.verification_method = 'veriff'
ON CONFLICT DO NOTHING;

UPDATE public.matches
SET
  score_version = COALESCE(score_version, 'legacy-match/v1'),
  reason_codes = COALESCE(reason_codes, '{}'::text[]),
  generated_at = COALESCE(generated_at, created_at, NOW())
WHERE score_version IS NULL
   OR reason_codes IS NULL
   OR generated_at IS NULL;
