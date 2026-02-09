-- Add verification token column for magic link verification
ALTER TABLE skill_verification_requests 
ADD COLUMN IF NOT EXISTS verification_token TEXT UNIQUE;

-- Add index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_skill_verification_requests_token 
ON skill_verification_requests(verification_token) WHERE verification_token IS NOT NULL;
