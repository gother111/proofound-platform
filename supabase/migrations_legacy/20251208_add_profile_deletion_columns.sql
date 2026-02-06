-- Add missing profile deletion fields used by cron workflows
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Helpful indexes for cron lookups
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled_for
  ON profiles (deletion_scheduled_for);

CREATE INDEX IF NOT EXISTS idx_profiles_deleted
  ON profiles (deleted);

