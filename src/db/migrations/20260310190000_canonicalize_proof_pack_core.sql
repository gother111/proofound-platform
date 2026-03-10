ALTER TABLE proof_packs
  ADD COLUMN IF NOT EXISTS primary_subject_type text,
  ADD COLUMN IF NOT EXISTS primary_subject_id uuid,
  ADD COLUMN IF NOT EXISTS lifecycle_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_summary text,
  ADD COLUMN IF NOT EXISTS outcomes_summary text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS freshness_state text NOT NULL DEFAULT 'stale',
  ADD COLUMN IF NOT EXISTS freshness_evaluated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS portability_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_proof_packs_primary_subject
  ON proof_packs (primary_subject_type, primary_subject_id);

UPDATE proof_packs
SET
  primary_subject_type = COALESCE(primary_subject_type, owner_type),
  primary_subject_id = COALESCE(primary_subject_id, owner_id),
  lifecycle_state = CASE
    WHEN lifecycle_state IS NOT NULL AND lifecycle_state <> '' THEN lifecycle_state
    WHEN legacy_source_table = 'profile_snippets' THEN 'published'
    ELSE 'ready'
  END,
  published_at = COALESCE(
    published_at,
    CASE WHEN legacy_source_table = 'profile_snippets' THEN created_at ELSE NULL END
  ),
  context_json = COALESCE(context_json, '{}'::jsonb),
  portability_meta = COALESCE(
    portability_meta,
    jsonb_build_object('exportSchemaVersion', 'owner_full/v1')
  )
WHERE primary_subject_type IS NULL
   OR primary_subject_id IS NULL
   OR lifecycle_state IS NULL
   OR context_json IS NULL
   OR portability_meta IS NULL;

WITH orphan_artifacts AS (
  SELECT pa.*
  FROM proof_artifacts pa
  LEFT JOIN proof_pack_items ppi ON ppi.artifact_id = pa.id
  WHERE ppi.id IS NULL
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
    created_by,
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
    COALESCE(pa.subject_type, pa.owner_type),
    COALESCE(pa.subject_id, pa.owner_id),
    CASE
      WHEN pa.lifecycle_state IN ('expired', 'revoked') THEN 'archived'
      ELSE 'ready'
    END,
    pa.title,
    pa.description,
    jsonb_build_object(
      'compatibilitySource', 'proof_artifacts_backfill',
      'artifactId', pa.id,
      'originType', COALESCE(pa.legacy_source_table, 'proof_artifact')
    ),
    COALESCE(pa.description, pa.title),
    NULL,
    pa.visibility,
    pa.reveal_gate,
    NULL,
    'unverified',
    CASE
      WHEN pa.expires_at IS NOT NULL AND pa.expires_at <= NOW() THEN 'expired'
      WHEN pa.issued_at IS NULL AND pa.updated_at IS NULL THEN 'stale'
      WHEN COALESCE(pa.updated_at, pa.issued_at, pa.created_at) >= NOW() - INTERVAL '90 days' THEN 'fresh'
      WHEN COALESCE(pa.updated_at, pa.issued_at, pa.created_at) >= NOW() - INTERVAL '180 days' THEN 'review_soon'
      WHEN COALESCE(pa.updated_at, pa.issued_at, pa.created_at) >= NOW() - INTERVAL '365 days' THEN 'stale'
      ELSE 'expired'
    END,
    NOW(),
    jsonb_build_object(
      'exportSchemaVersion', 'owner_full/v1',
      'originType', COALESCE(pa.legacy_source_table, 'proof_artifact'),
      'originRef', pa.id::text,
      'capturedAt', to_jsonb(COALESCE(pa.activated_at, pa.created_at)),
      'capturedByActorType', 'system',
      'captureSurface', 'migration_backfill',
      'completenessState', 'partial'
    ),
    COALESCE(pa.metadata, '{}'::jsonb),
    'proof_artifacts',
    pa.id,
    pa.created_at,
    pa.updated_at
  FROM orphan_artifacts pa
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
JOIN proof_artifacts pa ON pa.id = ip.legacy_source_id
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
  GROUP BY pp.id
)
UPDATE proof_packs pp
SET
  verification_status = vr.verification_status,
  last_verified_at = vr.last_verified_at,
  freshness_state = fr.freshness_state,
  freshness_evaluated_at = NOW(),
  last_refreshed_at = COALESCE(pp.last_refreshed_at, fr.last_refreshed_at)
FROM verification_rollups vr
JOIN freshness_rollups fr ON fr.pack_id = vr.pack_id
WHERE pp.id = vr.pack_id;
