-- Narrow the org hiring corridor to minimal trust readiness and assignment readiness states.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS org_readiness TEXT NOT NULL DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_org_readiness_check'
      AND conrelid = 'organizations'::regclass
  ) THEN
    ALTER TABLE organizations
      ADD CONSTRAINT organizations_org_readiness_check
      CHECK (org_readiness IN ('draft', 'org_ready'));
  END IF;
END $$;

UPDATE organizations
SET org_readiness = CASE
  WHEN
    COALESCE(NULLIF(BTRIM(display_name), ''), NULL) IS NOT NULL
    AND COALESCE(NULLIF(BTRIM(mission), ''), NULL) IS NOT NULL
    AND COALESCE(NULLIF(BTRIM(tagline), ''), NULL) IS NOT NULL
    AND COALESCE(NULLIF(BTRIM(working_context), ''), NULL) IS NOT NULL
    AND COALESCE(NULLIF(BTRIM(website), ''), NULL) IS NOT NULL
    AND (
      website_verified_at IS NOT NULL
      OR trust_status IN ('domain_verified', 'platform_reviewed')
      OR verified = TRUE
    )
  THEN 'org_ready'
  ELSE 'draft'
END;

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS engagement_type TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignments_engagement_type_check'
      AND conrelid = 'assignments'::regclass
  ) THEN
    ALTER TABLE assignments
      ADD CONSTRAINT assignments_engagement_type_check
      CHECK (
        engagement_type IS NULL
        OR engagement_type IN (
          'full_time',
          'part_time',
          'contract_consulting',
          'fractional_project'
        )
      );
  END IF;
END $$;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname
  INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'assignments'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%creation_status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE assignments DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

UPDATE assignments
SET creation_status = CASE creation_status
  WHEN 'published' THEN 'review_ready'
  WHEN 'ready_to_publish' THEN 'review_ready'
  WHEN 'pending_review' THEN 'review_ready'
  WHEN 'pipeline_in_progress' THEN 'draft'
  ELSE creation_status
END
WHERE creation_status IN ('published', 'ready_to_publish', 'pending_review', 'pipeline_in_progress');

ALTER TABLE assignments
  ADD CONSTRAINT assignments_creation_status_check
  CHECK (creation_status IN ('draft', 'assignment_ready', 'review_ready'));

DROP POLICY IF EXISTS "Public read for published assignment outcomes" ON assignment_outcomes;
CREATE POLICY "Public read for published assignment outcomes" ON assignment_outcomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM assignments a
      WHERE a.id = assignment_id
        AND a.status = 'active'
        AND a.creation_status = 'review_ready'
    )
  );

DROP POLICY IF EXISTS "Public read for published expertise matrix" ON assignment_expertise_matrix;
CREATE POLICY "Public read for published expertise matrix" ON assignment_expertise_matrix
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM assignments a
      WHERE a.id = assignment_id
        AND a.status = 'active'
        AND a.creation_status = 'review_ready'
    )
  );

CREATE OR REPLACE FUNCTION update_assignment_creation_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE assignments
    SET
      creation_status = 'assignment_ready',
      pipeline_completed_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.assignment_id
      AND creation_status = 'draft';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN organizations.org_readiness IS
  'Minimal org trust readiness: draft until the trust card is complete and domain trust is confirmed, then org_ready.';

COMMENT ON COLUMN assignments.creation_status IS
  'Narrow assignment readiness: draft > assignment_ready > review_ready.';

COMMENT ON FUNCTION update_assignment_creation_status IS
  'Legacy pipeline trigger compatibility: marks assignments as assignment_ready when legacy pipeline steps complete.';
