-- Add missing columns to individual_profiles table
ALTER TABLE individual_profiles 
ADD COLUMN IF NOT EXISTS field_visibility jsonb,
ADD COLUMN IF NOT EXISTS redact_mode boolean DEFAULT false;

-- Add missing column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tour_completed boolean DEFAULT false;
