-- Migration: Add LinkedIn Verification Support
-- Description: Adds LinkedIn as a third identity verification method alongside Veriff and Work Email
-- Date: 2025-11-01

-- Add 'linkedin' to verification_method enum
ALTER TABLE individual_profiles 
  DROP CONSTRAINT IF EXISTS individual_profiles_verification_method_check;

ALTER TABLE individual_profiles 
  ADD CONSTRAINT individual_profiles_verification_method_check 
  CHECK (verification_method IN ('veriff', 'work_email', 'linkedin'));

-- Add LinkedIn verification fields
ALTER TABLE individual_profiles 
  ADD COLUMN IF NOT EXISTS linkedin_profile_url text,
  ADD COLUMN IF NOT EXISTS linkedin_verification_data jsonb;

-- Create index for LinkedIn profile URL lookups
CREATE INDEX IF NOT EXISTS idx_individual_profiles_linkedin_url 
  ON individual_profiles(linkedin_profile_url) 
  WHERE linkedin_profile_url IS NOT NULL;

-- Add comments explaining LinkedIn verification fields
COMMENT ON COLUMN individual_profiles.linkedin_profile_url IS 'Public LinkedIn profile URL obtained via OAuth';
COMMENT ON COLUMN individual_profiles.linkedin_verification_data IS 'JSONB data containing: hasVerificationBadge (boolean), automatedCheck (confidence score and signals), thirdPartyData (optional enrichment), adminReviewed (boolean), adminNotes (string)';

-- Note: The verified column remains TRUE when any method (veriff, work_email, or linkedin) successfully verifies identity
COMMENT ON COLUMN individual_profiles.verification_method IS 'Method used for verification: veriff, work_email, or linkedin';

