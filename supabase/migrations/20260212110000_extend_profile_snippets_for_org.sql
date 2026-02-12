-- ============================================================================
-- EXTEND PROFILE SNIPPETS FOR ORGANIZATION SHARING
-- Adds profile_type/org_id support so /p/<token> can represent individual or org snippets.
-- ============================================================================

ALTER TABLE profile_snippets
  ADD COLUMN IF NOT EXISTS profile_type TEXT NOT NULL DEFAULT 'individual';

ALTER TABLE profile_snippets
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE profile_snippets
SET profile_type = 'individual'
WHERE profile_type IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_snippets_profile_type_check'
  ) THEN
    ALTER TABLE profile_snippets
      ADD CONSTRAINT profile_snippets_profile_type_check
      CHECK (profile_type IN ('individual', 'organization'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profile_snippets_profile_target_check'
  ) THEN
    ALTER TABLE profile_snippets
      ADD CONSTRAINT profile_snippets_profile_target_check
      CHECK (
        (profile_type = 'individual' AND org_id IS NULL) OR
        (profile_type = 'organization' AND org_id IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profile_snippets_profile_type ON profile_snippets(profile_type);
CREATE INDEX IF NOT EXISTS idx_profile_snippets_org_id ON profile_snippets(org_id);
