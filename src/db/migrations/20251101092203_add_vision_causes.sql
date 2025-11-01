-- Migration: Add vision to individual_profiles and causes to organizations
-- Created: 2025-11-01

-- Add vision field to individual_profiles
ALTER TABLE individual_profiles 
ADD COLUMN IF NOT EXISTS vision TEXT;

-- Add causes field to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS causes TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN individual_profiles.vision IS 'Individual vision statement (≤300 chars recommended)';
COMMENT ON COLUMN organizations.causes IS 'Array of cause tags the organization supports';

