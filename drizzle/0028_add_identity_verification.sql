-- Migration: Add Identity Verification Fields
-- Description: Adds Veriff and work email verification tracking to individual_profiles
-- Date: 2025-10-31

-- Add verification tracking fields to individual_profiles
ALTER TABLE individual_profiles 
  ADD COLUMN IF NOT EXISTS verification_method text CHECK (verification_method IN ('veriff', 'work_email')),
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed')),
  ADD COLUMN IF NOT EXISTS veriff_session_id text,
  ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS work_email text,
  ADD COLUMN IF NOT EXISTS work_email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS work_email_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS work_email_token text,
  ADD COLUMN IF NOT EXISTS work_email_token_expires timestamp with time zone;

-- Create index for work email lookups
CREATE INDEX IF NOT EXISTS idx_individual_profiles_work_email ON individual_profiles(work_email) WHERE work_email IS NOT NULL;

-- Create index for verification status queries
CREATE INDEX IF NOT EXISTS idx_individual_profiles_verification_status ON individual_profiles(verification_status);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_individual_profiles_work_email_token ON individual_profiles(work_email_token) WHERE work_email_token IS NOT NULL;

-- Add comment explaining verification logic
COMMENT ON COLUMN individual_profiles.verified IS 'TRUE when either Veriff verification succeeds OR work email is verified';
COMMENT ON COLUMN individual_profiles.verification_method IS 'Method used for verification: veriff or work_email';
COMMENT ON COLUMN individual_profiles.verification_status IS 'Current verification status: unverified, pending, verified, or failed';

