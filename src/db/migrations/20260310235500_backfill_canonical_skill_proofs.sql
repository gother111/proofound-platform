WITH missing_skill_proofs AS (
  SELECT sp.*
  FROM skill_proofs sp
  LEFT JOIN proof_artifacts pa
    ON pa.legacy_source_table = 'skill_proofs'
   AND pa.legacy_source_id = sp.id
  WHERE pa.id IS NULL
),
inserted_artifacts AS (
  INSERT INTO proof_artifacts (
    owner_type,
    owner_id,
    subject_type,
    subject_id,
    artifact_kind,
    lifecycle_state,
    title,
    description,
    source_url,
    storage_path,
    activated_at,
    issued_at,
    expires_at,
    visibility,
    reveal_gate,
    metadata,
    legacy_source_table,
    legacy_source_id,
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
    'active',
    COALESCE(NULLIF(TRIM(sp.title), ''), 'Proof'),
    sp.description,
    sp.url,
    sp.file_path,
    COALESCE(sp.created_at, NOW()),
    CASE WHEN sp.issued_date IS NOT NULL THEN sp.issued_date::timestamptz ELSE NULL END,
    CASE WHEN sp.expires_date IS NOT NULL THEN sp.expires_date::timestamptz ELSE NULL END,
    CASE
      WHEN COALESCE(sp.metadata ->> 'visibility', '') = 'public' THEN 'public'
      WHEN COALESCE(sp.metadata ->> 'visibility', '') IN ('network', 'network_only', 'link_only') THEN 'link_only'
      WHEN COALESCE(sp.metadata ->> 'visibility', '') IN ('match-only', 'match_only') THEN 'matched_org'
      ELSE 'owner_only'
    END,
    CASE
      WHEN COALESCE(sp.metadata ->> 'visibility', '') IN ('match-only', 'match_only') THEN 'match_exists'
      ELSE 'none'
    END,
    COALESCE(sp.metadata, '{}'::jsonb),
    'skill_proofs',
    sp.id,
    COALESCE(sp.created_at, NOW()),
    COALESCE(sp.updated_at, COALESCE(sp.created_at, NOW()))
  FROM missing_skill_proofs sp
  RETURNING id
),
orphan_skill_artifacts AS (
  SELECT pa.*
  FROM proof_artifacts pa
  LEFT JOIN proof_pack_items ppi ON ppi.artifact_id = pa.id
  WHERE pa.legacy_source_table = 'skill_proofs'
    AND ppi.id IS NULL
    AND pa.deleted_at IS NULL
),
inserted_packs AS (
  INSERT INTO proof_packs (
    owner_type,
    owner_id,
    pack_kind,
    primary_subject_type,
    primary_subject_id,
    lifecycle_state,
    title,
    summary,
    context_json,
    evidence_summary,
    outcomes_summary,
    visibility,
    reveal_gate,
    verification_status,
    freshness_state,
    freshness_evaluated_at,
    portability_meta,
    metadata,
    legacy_source_table,
    legacy_source_id,
    created_at,
    updated_at
  )
  SELECT
    pa.owner_type,
    pa.owner_id,
    'verification_bundle',
    'skill',
    pa.subject_id,
    'ready',
    pa.title,
    pa.description,
    jsonb_build_object(
      'compatibilitySource', 'skill_proofs_backfill',
      'artifactId', pa.id,
      'legacySkillProofId', pa.legacy_source_id
    ),
    COALESCE(pa.description, pa.title),
    NULL,
    pa.visibility,
    pa.reveal_gate,
    'unverified',
    CASE
      WHEN pa.expires_at IS NOT NULL AND pa.expires_at <= NOW() THEN 'expired'
      WHEN COALESCE(pa.updated_at, pa.issued_at, pa.created_at) >= NOW() - INTERVAL '90 days' THEN 'fresh'
      WHEN COALESCE(pa.updated_at, pa.issued_at, pa.created_at) >= NOW() - INTERVAL '180 days' THEN 'review_soon'
      WHEN COALESCE(pa.updated_at, pa.issued_at, pa.created_at) >= NOW() - INTERVAL '365 days' THEN 'stale'
      ELSE 'expired'
    END,
    NOW(),
    jsonb_build_object(
      'exportSchemaVersion', 'owner_full/v1',
      'originType', 'skill_proofs',
      'originRef', pa.legacy_source_id::text,
      'capturedAt', to_jsonb(COALESCE(pa.activated_at, pa.created_at)),
      'capturedByActorType', 'system',
      'captureSurface', 'migration_backfill',
      'completenessState', 'partial'
    ),
    COALESCE(pa.metadata, '{}'::jsonb),
    'skill_proofs',
    pa.legacy_source_id,
    pa.created_at,
    pa.updated_at
  FROM orphan_skill_artifacts pa
  RETURNING id, legacy_source_id
)
INSERT INTO proof_pack_items (pack_id, artifact_id, position, included_fields, created_at, updated_at)
SELECT
  ip.id,
  pa.id,
  0,
  '[]'::jsonb,
  NOW(),
  NOW()
FROM inserted_packs ip
JOIN proof_artifacts pa ON pa.legacy_source_id = ip.legacy_source_id
WHERE pa.legacy_source_table = 'skill_proofs'
ON CONFLICT (pack_id, artifact_id) DO NOTHING;

WITH verification_rollups AS (
  SELECT
    pp.id AS pack_id,
    CASE
      WHEN COUNT(vr.id) FILTER (
        WHERE vr.status IN ('disputed', 'contradicted', 'revoked', 'downgraded')
      ) > 0 THEN 'disputed'
      WHEN COUNT(vr.id) FILTER (WHERE vr.status = 'verified') > 0
           AND COUNT(ppi.artifact_id) > 0
           AND COUNT(DISTINCT ppi.artifact_id) FILTER (
             WHERE vr.status = 'verified' AND vr.proof_artifact_id = ppi.artifact_id
           ) = COUNT(DISTINCT ppi.artifact_id) THEN 'verified'
      WHEN COUNT(vr.id) FILTER (WHERE vr.status = 'verified') > 0 THEN 'partially_verified'
      ELSE 'unverified'
    END AS verification_status,
    MAX(vr.verified_at) FILTER (WHERE vr.status = 'verified') AS last_verified_at
  FROM proof_packs pp
  LEFT JOIN proof_pack_items ppi ON ppi.pack_id = pp.id
  LEFT JOIN verification_records vr
    ON (
      vr.proof_artifact_id = ppi.artifact_id
      OR (
        vr.subject_type = pp.primary_subject_type
        AND vr.subject_id = pp.primary_subject_id
      )
    )
   AND vr.owner_type = pp.owner_type
   AND vr.owner_id = pp.owner_id
  WHERE pp.legacy_source_table = 'skill_proofs'
  GROUP BY pp.id
),
freshness_rollups AS (
  SELECT
    pp.id AS pack_id,
    CASE
      WHEN COUNT(ppi.id) = 0 THEN 'stale'
      WHEN BOOL_OR(pa.expires_at IS NOT NULL AND pa.expires_at <= NOW()) THEN 'expired'
      WHEN BOOL_OR(COALESCE(pa.updated_at, pa.issued_at, pa.created_at) < NOW() - INTERVAL '365 days') THEN 'expired'
      WHEN BOOL_OR(COALESCE(pa.updated_at, pa.issued_at, pa.created_at) < NOW() - INTERVAL '180 days') THEN 'stale'
      WHEN BOOL_OR(COALESCE(pa.updated_at, pa.issued_at, pa.created_at) < NOW() - INTERVAL '90 days') THEN 'review_soon'
      ELSE 'fresh'
    END AS freshness_state,
    MAX(COALESCE(pa.updated_at, pa.issued_at, pa.created_at)) AS last_refreshed_at
  FROM proof_packs pp
  LEFT JOIN proof_pack_items ppi ON ppi.pack_id = pp.id
  LEFT JOIN proof_artifacts pa ON pa.id = ppi.artifact_id
  WHERE pp.legacy_source_table = 'skill_proofs'
  GROUP BY pp.id
)
UPDATE proof_packs pp
SET
  verification_status = vr.verification_status,
  last_verified_at = vr.last_verified_at,
  freshness_state = fr.freshness_state,
  freshness_evaluated_at = NOW(),
  last_refreshed_at = COALESCE(fr.last_refreshed_at, pp.last_refreshed_at)
FROM verification_rollups vr
JOIN freshness_rollups fr ON fr.pack_id = vr.pack_id
WHERE pp.id = vr.pack_id;
