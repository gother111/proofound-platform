ALTER TABLE proof_packs
  ADD COLUMN IF NOT EXISTS primary_claim_type text,
  ADD COLUMN IF NOT EXISTS role_context text,
  ADD COLUMN IF NOT EXISTS ownership_statement text,
  ADD COLUMN IF NOT EXISTS timeframe_start date,
  ADD COLUMN IF NOT EXISTS timeframe_end date,
  ADD COLUMN IF NOT EXISTS timeframe_label text,
  ADD COLUMN IF NOT EXISTS verification_summary text,
  ADD COLUMN IF NOT EXISTS proof_quality_score numeric,
  ADD COLUMN IF NOT EXISTS schema_version text NOT NULL DEFAULT 'proof_pack/v2';

ALTER TABLE proof_pack_items
  ADD COLUMN IF NOT EXISTS item_class text,
  ADD COLUMN IF NOT EXISTS subtype_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE proof_packs
SET
  primary_claim_type = COALESCE(
    primary_claim_type,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM proof_pack_items ppi
        INNER JOIN proof_artifacts pa ON pa.id = ppi.artifact_id
        WHERE ppi.pack_id = proof_packs.id
          AND pa.artifact_kind = 'credential'
      ) THEN 'credential_fact'
      WHEN EXISTS (
        SELECT 1
        FROM proof_pack_items ppi
        INNER JOIN proof_artifacts pa ON pa.id = ppi.artifact_id
        WHERE ppi.pack_id = proof_packs.id
          AND (
            lower(pa.title) ~ '(invoice|contract|agreement|statement of work|sow|offer letter)'
            OR COALESCE(pa.metadata->>'evidenceSubtype', '') IN ('invoice', 'contract', 'agreement', 'sow', 'offer_letter')
          )
      ) THEN 'engagement_fact'
      WHEN COALESCE(outcomes_summary, '') <> '' THEN 'outcome'
      ELSE 'contribution'
    END
  ),
  role_context = COALESCE(
    role_context,
    NULLIF(context_json->>'contextTitle', ''),
    NULLIF(context_json->>'roleContext', '')
  ),
  ownership_statement = COALESCE(
    ownership_statement,
    NULLIF(context_json->>'proofPackOwnership', ''),
    summary
  ),
  timeframe_label = COALESCE(
    timeframe_label,
    NULLIF(context_json->>'contextDuration', ''),
    NULLIF(context_json->>'timeframeLabel', '')
  ),
  verification_summary = COALESCE(
    verification_summary,
    NULLIF(context_json->>'verificationSummary', ''),
    evidence_summary
  ),
  proof_quality_score = COALESCE(
    proof_quality_score,
    ROUND(
      (
        (CASE WHEN COALESCE(summary, '') <> '' THEN 0.2 ELSE 0 END) +
        (CASE WHEN COALESCE(outcomes_summary, '') <> '' THEN 0.2 ELSE 0 END) +
        (CASE WHEN EXISTS (
          SELECT 1
          FROM proof_pack_items ppi
          WHERE ppi.pack_id = proof_packs.id
        ) THEN 0.2 ELSE 0 END) +
        (CASE verification_status
          WHEN 'verified' THEN 0.2
          WHEN 'partially_verified' THEN 0.1
          ELSE 0
        END) +
        (CASE freshness_state
          WHEN 'fresh' THEN 0.2
          WHEN 'review_soon' THEN 0.1
          ELSE 0
        END)
      )::numeric,
      2
    ),
    0
  ),
  schema_version = COALESCE(NULLIF(schema_version, ''), 'proof_pack/v2');

UPDATE proof_pack_items ppi
SET
  item_class = COALESCE(
    ppi.item_class,
    CASE
      WHEN pa.artifact_kind = 'credential' THEN 'credential_evidence'
      WHEN lower(pa.title) ~ '(invoice|contract|agreement|statement of work|sow|offer letter)'
        OR COALESCE(pa.metadata->>'evidenceSubtype', '') IN ('invoice', 'contract', 'agreement', 'sow', 'offer_letter')
        THEN 'engagement_evidence'
      WHEN COALESCE(pa.metadata->>'artifactSubtype', '') IN ('reviewer_note', 'structured_reviewer_note')
        OR pa.artifact_kind = 'reference'
        THEN 'reviewer_note'
      WHEN COALESCE(pa.metadata->>'artifactSubtype', '') IN ('case_fragment', 'case_study_fragment')
        THEN 'case_fragment'
      WHEN COALESCE(pa.source_url, '') ~ 'github\\.com/.+/(pull|pulls|commit)/'
        OR COALESCE(pa.metadata->>'artifactSubtype', '') IN ('repo', 'commit', 'pr')
        THEN 'repo_activity'
      WHEN pa.source_url IS NOT NULL THEN 'url_link'
      ELSE 'file_upload'
    END
  ),
  subtype_metadata = COALESCE(
    NULLIF(ppi.subtype_metadata, '{}'::jsonb),
    jsonb_strip_nulls(
      jsonb_build_object(
        'subtype',
        CASE
          WHEN COALESCE(pa.metadata->>'artifactSubtype', '') <> '' THEN pa.metadata->>'artifactSubtype'
          WHEN COALESCE(pa.source_url, '') ~ 'github\\.com/.+/pull/' THEN 'pr'
          WHEN COALESCE(pa.source_url, '') ~ 'github\\.com/.+/commit/' THEN 'commit'
          WHEN COALESCE(pa.source_url, '') ~ 'github\\.com/' THEN 'repo'
          WHEN pa.artifact_kind = 'image' THEN 'photo'
          WHEN pa.artifact_kind = 'video' THEN 'video'
          WHEN pa.artifact_kind = 'document' THEN 'doc'
          WHEN pa.artifact_kind = 'credential' THEN 'certificate'
          ELSE NULL
        END,
        'artifactKind',
        pa.artifact_kind
      )
    ),
    '{}'::jsonb
  )
FROM proof_artifacts pa
WHERE pa.id = ppi.artifact_id;

ALTER TABLE proof_packs
  ALTER COLUMN primary_claim_type SET DEFAULT 'contribution';

ALTER TABLE proof_pack_items
  ALTER COLUMN item_class SET DEFAULT 'file_upload';
