-- Matching System Tables Migration
-- Creates tables for blind-first deterministic matching

-- Matching profiles table (1:1 with profiles)
CREATE TABLE IF NOT EXISTS matching_profiles (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  values_tags TEXT[] DEFAULT '{}'::TEXT[],
  cause_tags TEXT[] DEFAULT '{}'::TEXT[],
  timezone TEXT,
  languages JSONB DEFAULT '[]'::JSONB,
  verified JSONB DEFAULT '{}'::JSONB,
  right_to_work TEXT CHECK (right_to_work IN ('yes', 'no', 'conditional')),
  country TEXT,
  city TEXT,
  availability_earliest DATE,
  availability_latest DATE,
  work_mode TEXT CHECK (work_mode IN ('remote', 'onsite', 'hybrid')),
  radius_km INTEGER,
  hours_min INTEGER,
  hours_max INTEGER,
  comp_min INTEGER,
  comp_max INTEGER,
  currency TEXT DEFAULT 'USD',
  weights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills table (many-to-one with profiles)
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 0 AND 5),
  months_experience INTEGER NOT NULL DEFAULT 0 CHECK (months_experience >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, skill_id)
);

-- Assignments table (job/project postings)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  values_required TEXT[] DEFAULT '{}'::TEXT[],
  cause_tags TEXT[] DEFAULT '{}'::TEXT[],
  must_have_skills JSONB DEFAULT '[]'::JSONB,
  nice_to_have_skills JSONB DEFAULT '[]'::JSONB,
  min_language JSONB,
  location_mode TEXT CHECK (location_mode IN ('remote', 'onsite', 'hybrid')),
  radius_km INTEGER,
  country TEXT,
  city TEXT,
  comp_min INTEGER,
  comp_max INTEGER,
  currency TEXT DEFAULT 'USD',
  hours_min INTEGER,
  hours_max INTEGER,
  start_earliest DATE,
  start_latest DATE,
  verification_gates TEXT[] DEFAULT '{}'::TEXT[],
  weights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matches table (cached match results)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  vector JSONB NOT NULL,
  weights JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, profile_id)
);

-- Match interest table (tracks "Interested" for mutual reveal)
CREATE TABLE IF NOT EXISTS match_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(actor_profile_id, assignment_id, target_profile_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matching_profiles_values ON matching_profiles USING GIN (values_tags);
CREATE INDEX IF NOT EXISTS idx_matching_profiles_causes ON matching_profiles USING GIN (cause_tags);
CREATE INDEX IF NOT EXISTS idx_assignments_values ON assignments USING GIN (values_required);
CREATE INDEX IF NOT EXISTS idx_assignments_causes ON assignments USING GIN (cause_tags);
CREATE INDEX IF NOT EXISTS idx_skills_profile ON skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_matches_assignment ON matches(assignment_id);
CREATE INDEX IF NOT EXISTS idx_matches_profile ON matches(profile_id);
CREATE INDEX IF NOT EXISTS idx_interest_lookup ON match_interest(assignment_id, target_profile_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_matching_profiles_updated_at BEFORE UPDATE ON matching_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

