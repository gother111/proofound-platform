-- Migration: Add Unique Constraint for Verified Work Emails
-- Description: Prevents duplicate verified work emails using a partial unique index
-- Date: 2025-10-31
-- Fixes: Race condition allowing duplicate verified work emails

-- Create partial unique index on work_email where verified = true
-- This ensures only one user can have a verified work email at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_individual_profiles_work_email_verified_unique 
ON individual_profiles(work_email) 
WHERE work_email IS NOT NULL AND work_email_verified = true;

-- Add comment explaining the constraint
COMMENT ON INDEX idx_individual_profiles_work_email_verified_unique IS 
'Ensures only one user can verify a given work email address';

