UPDATE proof_packs
SET
  primary_subject_type = owner_type,
  primary_subject_id = owner_id,
  updated_at = NOW()
WHERE pack_kind IN ('profile_export', 'organization_export')
  AND (
    primary_subject_type IS DISTINCT FROM owner_type
    OR primary_subject_id IS DISTINCT FROM owner_id
  );

WITH inferred_context_anchor AS (
  SELECT
    id AS pack_id,
    COALESCE(
      NULLIF(context_json->>'primaryAnchorType', ''),
      NULLIF(metadata->>'primaryAnchorType', ''),
      NULLIF(context_json->>'contextType', '')
    ) AS inferred_type,
    CASE
      WHEN COALESCE(
        NULLIF(context_json->>'primaryAnchorId', ''),
        NULLIF(metadata->>'primaryAnchorId', ''),
        NULLIF(context_json->>'contextId', '')
      ) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN COALESCE(
          NULLIF(context_json->>'primaryAnchorId', ''),
          NULLIF(metadata->>'primaryAnchorId', ''),
          NULLIF(context_json->>'contextId', '')
        )::uuid
      ELSE NULL
    END AS inferred_id
  FROM proof_packs
  WHERE pack_kind = 'verification_bundle'
    AND deleted_at IS NULL
    AND (
      primary_subject_type NOT IN ('experience', 'education', 'volunteering')
      OR primary_subject_id IS NULL
    )
)
UPDATE proof_packs pp
SET
  primary_subject_type = inferred.inferred_type,
  primary_subject_id = inferred.inferred_id,
  updated_at = NOW()
FROM inferred_context_anchor inferred
WHERE pp.id = inferred.pack_id
  AND inferred.inferred_type IN ('experience', 'education', 'volunteering')
  AND inferred.inferred_id IS NOT NULL;

WITH artifact_anchor_candidates AS (
  SELECT
    ppi.pack_id,
    pa.subject_type,
    pa.subject_id
  FROM proof_pack_items ppi
  INNER JOIN proof_artifacts pa ON pa.id = ppi.artifact_id
  INNER JOIN proof_packs pp ON pp.id = ppi.pack_id
  WHERE pp.pack_kind = 'verification_bundle'
    AND pp.deleted_at IS NULL
    AND (
      pp.primary_subject_type NOT IN ('experience', 'education', 'volunteering')
      OR pp.primary_subject_id IS NULL
    )
    AND pa.subject_type IN ('experience', 'education', 'volunteering')
    AND pa.subject_id IS NOT NULL
),
single_artifact_anchor AS (
  SELECT
    pack_id,
    MIN(subject_type) AS subject_type,
    MIN(subject_id::text)::uuid AS subject_id
  FROM artifact_anchor_candidates
  GROUP BY pack_id
  HAVING COUNT(DISTINCT subject_type || ':' || subject_id::text) = 1
)
UPDATE proof_packs pp
SET
  primary_subject_type = inferred.subject_type,
  primary_subject_id = inferred.subject_id,
  updated_at = NOW()
FROM single_artifact_anchor inferred
WHERE pp.id = inferred.pack_id;

UPDATE proof_packs
SET
  primary_subject_type = owner_type,
  primary_subject_id = owner_id,
  lifecycle_state = 'archived',
  visibility = 'owner_only',
  reveal_gate = 'none',
  archived_at = COALESCE(archived_at, NOW()),
  public_surface_disabled_at = COALESCE(public_surface_disabled_at, NOW()),
  export_excluded_reason = 'missing_primary_anchor_context',
  deleted_at = COALESCE(deleted_at, NOW()),
  delete_reason = COALESCE(delete_reason, 'missing_primary_anchor_context'),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'anchorQuarantinedAt', NOW(),
    'anchorQuarantineReason', 'missing_primary_anchor_context'
  ),
  updated_at = NOW()
WHERE pack_kind = 'verification_bundle'
  AND deleted_at IS NULL
  AND (
    primary_subject_type NOT IN ('experience', 'education', 'volunteering')
    OR primary_subject_id IS NULL
  );

ALTER TABLE proof_packs
  ALTER COLUMN primary_subject_type SET NOT NULL,
  ALTER COLUMN primary_subject_id SET NOT NULL;

ALTER TABLE proof_packs
  DROP CONSTRAINT IF EXISTS proof_packs_primary_anchor_required_chk;

ALTER TABLE proof_packs
  ADD CONSTRAINT proof_packs_primary_anchor_required_chk
  CHECK (
    deleted_at IS NOT NULL
    OR (primary_subject_type IS NOT NULL AND primary_subject_id IS NOT NULL)
  );

ALTER TABLE proof_packs
  DROP CONSTRAINT IF EXISTS proof_packs_verification_bundle_anchor_chk;

ALTER TABLE proof_packs
  ADD CONSTRAINT proof_packs_verification_bundle_anchor_chk
  CHECK (
    deleted_at IS NOT NULL
    OR pack_kind <> 'verification_bundle'
    OR primary_subject_type IN ('experience', 'education', 'volunteering')
  );

ALTER TABLE proof_packs
  DROP CONSTRAINT IF EXISTS proof_packs_export_owner_anchor_chk;

ALTER TABLE proof_packs
  ADD CONSTRAINT proof_packs_export_owner_anchor_chk
  CHECK (
    deleted_at IS NOT NULL
    OR pack_kind NOT IN ('profile_export', 'organization_export')
    OR (
      primary_subject_type = owner_type
      AND primary_subject_id = owner_id
    )
  );
