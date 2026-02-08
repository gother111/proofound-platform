-- Add profile_field_visibility table for granular privacy controls
-- Created: 2025-11-04
-- Purpose: Allow individual profiles to control field-level visibility settings

CREATE TABLE IF NOT EXISTS profile_field_visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Visibility levels: 'public', 'network_only', 'match_only', 'private'
  display_name TEXT NOT NULL DEFAULT 'public',
  avatar TEXT NOT NULL DEFAULT 'public',
  headline TEXT NOT NULL DEFAULT 'public',
  location TEXT NOT NULL DEFAULT 'network_only',
  mission TEXT NOT NULL DEFAULT 'public',
  vision TEXT NOT NULL DEFAULT 'public',
  values TEXT NOT NULL DEFAULT 'public',
  causes TEXT NOT NULL DEFAULT 'public',
  experiences TEXT NOT NULL DEFAULT 'network_only',
  education TEXT NOT NULL DEFAULT 'public',
  volunteering TEXT NOT NULL DEFAULT 'public',
  skills TEXT NOT NULL DEFAULT 'public',
  impact_stories TEXT NOT NULL DEFAULT 'match_only',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_profile_field_visibility_profile_id
  ON profile_field_visibility(profile_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE profile_field_visibility ENABLE ROW LEVEL SECURITY;

-- Users can read their own visibility settings
CREATE POLICY "Users can view their own visibility settings"
  ON profile_field_visibility
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Users can insert their own visibility settings
CREATE POLICY "Users can create their own visibility settings"
  ON profile_field_visibility
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Users can update their own visibility settings
CREATE POLICY "Users can update their own visibility settings"
  ON profile_field_visibility
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Users can delete their own visibility settings
CREATE POLICY "Users can delete their own visibility settings"
  ON profile_field_visibility
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Add comment for documentation
COMMENT ON TABLE profile_field_visibility IS 'Granular privacy controls for individual profile fields. Users can set visibility to public, network_only, match_only, or private for each field.';
