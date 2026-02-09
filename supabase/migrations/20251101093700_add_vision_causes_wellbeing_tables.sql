-- Migration: Add vision to individual_profiles, causes to organizations, and wellbeing tables
-- Phase 1 Complete Implementation

-- Add vision field to individual_profiles
ALTER TABLE individual_profiles 
ADD COLUMN IF NOT EXISTS vision TEXT;

-- Add causes field to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS causes TEXT[];

-- Create wellbeing_checkins table
CREATE TABLE IF NOT EXISTS wellbeing_checkins (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
	stress_level INTEGER NOT NULL,
	control_level INTEGER NOT NULL,
	milestone_trigger_id TEXT,
	created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create wellbeing_opt_ins table
CREATE TABLE IF NOT EXISTS wellbeing_opt_ins (
	user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
	opted_in BOOLEAN DEFAULT FALSE NOT NULL,
	privacy_banner_acknowledged BOOLEAN DEFAULT FALSE,
	opted_in_at TIMESTAMP,
	opted_out_at TIMESTAMP,
	updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create wellbeing_reflections table
CREATE TABLE IF NOT EXISTS wellbeing_reflections (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
	reflection_text TEXT NOT NULL,
	milestone_type TEXT,
	linked_checkin_id UUID REFERENCES wellbeing_checkins(id) ON DELETE SET NULL,
	created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add comments for documentation
COMMENT ON COLUMN individual_profiles.vision IS 'Individual vision statement (≤300 chars recommended)';
COMMENT ON COLUMN organizations.causes IS 'Array of cause tags the organization supports';
COMMENT ON TABLE wellbeing_checkins IS 'Privacy-first well-being check-ins. Never used in matching/ranking.';
COMMENT ON TABLE wellbeing_opt_ins IS 'User consent for Zen Hub features';
COMMENT ON TABLE wellbeing_reflections IS 'Milestone-linked reflections for users';
