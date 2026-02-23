-- Add assignment builder mode to support basic and advanced publish paths.
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS builder_mode TEXT NOT NULL DEFAULT 'basic'
  CHECK (builder_mode IN ('basic', 'advanced'));

COMMENT ON COLUMN assignments.builder_mode IS 'Assignment creation mode: basic (default) or advanced';
