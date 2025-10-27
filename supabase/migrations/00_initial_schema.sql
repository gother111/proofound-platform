-- Proofound MVP - Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT CHECK (account_type IN ('individual', 'organization')),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,

  -- Professional Info
  professional_summary TEXT,
  mission TEXT,
  vision TEXT,
  causes JSONB DEFAULT '[]'::jsonb,
  values JSONB DEFAULT '[]'::jsonb,

  -- Location & Availability
  region TEXT,
  timezone TEXT,
  languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  industry TEXT[] DEFAULT ARRAY[]::TEXT[],
  availability_status TEXT DEFAULT 'open_to_opportunities',
  available_for_match BOOLEAN DEFAULT true,
  available_start_date TIMESTAMPTZ,

  -- Compensation (for individuals)
  salary_band_min NUMERIC,
  salary_band_max NUMERIC,

  -- Organization-specific
  organization_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_admin BOOLEAN DEFAULT false,

  -- Privacy
  field_visibility JSONB DEFAULT '{
    "email": false,
    "phone": false,
    "location": true,
    "salary": false
  }'::jsonb,

  -- Metadata
  profile_completion_percentage INTEGER DEFAULT 0,
  profile_ready_for_match BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  organization_type TEXT,
  size_category TEXT,
  industry TEXT[] DEFAULT ARRAY[]::TEXT[],
  location TEXT,
  timezone TEXT,
  mission TEXT,
  values JSONB DEFAULT '[]'::jsonb,
  causes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT DEFAULT 'full_time',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),

  -- Location & Time
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  timezone_preference TEXT,
  time_commitment TEXT,
  duration_text TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Compensation
  budget_min NUMERIC,
  budget_max NUMERIC,
  budget_currency TEXT DEFAULT 'USD',
  budget_masked BOOLEAN DEFAULT true,

  -- Requirements
  required_expertise JSONB DEFAULT '[]'::jsonb,
  required_languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  proof_requirements JSONB DEFAULT '[]'::jsonb,
  values_keywords JSONB DEFAULT '[]'::jsonb,
  expected_outcomes TEXT,
  impact_goals TEXT,

  -- Matching Weights
  mission_alignment_weight NUMERIC DEFAULT 0.25,
  core_expertise_weight NUMERIC DEFAULT 0.35,
  tools_weight NUMERIC DEFAULT 0.15,
  logistics_weight NUMERIC DEFAULT 0.15,
  recency_weight NUMERIC DEFAULT 0.10,

  -- Matching Config
  max_matches_to_show INTEGER DEFAULT 50,
  refresh_frequency TEXT DEFAULT 'daily',

  -- Stats
  total_matches_generated INTEGER DEFAULT 0,
  accepted_matches_count INTEGER DEFAULT 0,

  -- Timestamps
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,

  -- Match Scores
  overall_score NUMERIC NOT NULL,
  mission_values_score NUMERIC,
  mission_values_weight NUMERIC,
  core_expertise_score NUMERIC,
  core_expertise_weight NUMERIC,
  tools_score NUMERIC,
  tools_weight NUMERIC,
  logistics_score NUMERIC,
  logistics_weight NUMERIC,
  recency_score NUMERIC,
  recency_weight NUMERIC,

  -- Match Quality Indicators
  is_strong_match BOOLEAN DEFAULT false,
  is_near_match BOOLEAN DEFAULT false,
  is_cold_start BOOLEAN DEFAULT false,

  -- Match Explanation
  strengths JSONB DEFAULT '[]'::jsonb,
  gaps JSONB DEFAULT '[]'::jsonb,
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,

  -- Status & Communication
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'accepted', 'declined', 'expired')),
  communication_stage TEXT,
  decline_reason TEXT,

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  UNIQUE(profile_id, assignment_id)
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  -- Message Metadata
  sent_at_stage TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Attachments (future)
  attachments JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EXPERTISE ATLAS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS expertise_atlas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  skill_name TEXT NOT NULL,
  skill_category TEXT,
  proficiency_level TEXT,
  years_of_experience NUMERIC,
  last_used_date TIMESTAMPTZ,

  is_core_expertise BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  proof_count INTEGER DEFAULT 0,
  rank_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(profile_id, skill_name)
);

-- ============================================================================
-- PROOFS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  artifact_id UUID REFERENCES artifacts(id) ON DELETE SET NULL,
  claim_reference_id UUID,

  -- Claim Details
  claim_type TEXT,
  claim_text TEXT,
  proof_description TEXT,
  proof_url TEXT,

  -- Verification
  verification_status TEXT DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'declined', 'expired')
  ),
  confidence_score NUMERIC,
  decline_reason TEXT,

  -- Visibility
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VERIFICATION REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proof_id UUID REFERENCES proofs(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Verifier Details
  verifier_name TEXT NOT NULL,
  verifier_email TEXT NOT NULL,
  verifier_relationship TEXT,
  context_notes TEXT,

  -- Token & Security
  verification_token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'declined', 'expired')
  ),

  -- Verification Response
  verifier_response TEXT,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ARTIFACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,
  artifact_type TEXT,
  category TEXT,

  -- File/URL
  url TEXT,
  file_path TEXT,
  file_size_bytes BIGINT,

  -- Metadata
  artifact_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  visibility TEXT DEFAULT 'public',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,

  event_name TEXT NOT NULL,
  event_category TEXT,
  properties JSONB DEFAULT '{}'::jsonb,

  -- Request Context
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REPORTS TABLE (for moderation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_content_id UUID,
  reported_content_type TEXT,

  reason TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',

  -- Moderation
  moderation_status TEXT DEFAULT 'pending' CHECK (
    moderation_status IN ('pending', 'under_review', 'resolved', 'dismissed')
  ),
  assigned_moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_taken TEXT,
  action_details TEXT,
  moderator_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  actioned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_available_for_match ON profiles(available_for_match) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_organization_id ON assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_published_at ON assignments(published_at) WHERE status = 'published';

-- Matches
CREATE INDEX IF NOT EXISTS idx_matches_profile_id ON matches(profile_id);
CREATE INDEX IF NOT EXISTS idx_matches_assignment_id ON matches(assignment_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_overall_score ON matches(overall_score DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Expertise Atlas
CREATE INDEX IF NOT EXISTS idx_expertise_profile_id ON expertise_atlas(profile_id);
CREATE INDEX IF NOT EXISTS idx_expertise_skill_name ON expertise_atlas(skill_name);

-- Proofs
CREATE INDEX IF NOT EXISTS idx_proofs_profile_id ON proofs(profile_id);
CREATE INDEX IF NOT EXISTS idx_proofs_verification_status ON proofs(verification_status);

-- Verification Requests
CREATE INDEX IF NOT EXISTS idx_verification_token ON verification_requests(verification_token);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE expertise_atlas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile and public profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR deleted_at IS NULL);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations: Public read, organization members can update
CREATE POLICY "Organizations are viewable by everyone" ON organizations
  FOR SELECT USING (true);

CREATE POLICY "Organization members can update" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = organizations.id
    )
  );

-- Assignments: Public read for published, organization can manage
CREATE POLICY "Published assignments are viewable by everyone" ON assignments
  FOR SELECT USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Organization can manage assignments" ON assignments
  FOR ALL USING (created_by = auth.uid());

-- Matches: Users can view their own matches
CREATE POLICY "Users can view own matches" ON matches
  FOR SELECT USING (profile_id = auth.uid() OR assignment_id IN (
    SELECT id FROM assignments WHERE created_by = auth.uid()
  ));

CREATE POLICY "System can create matches" ON matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own matches" ON matches
  FOR UPDATE USING (profile_id = auth.uid());

-- Messages: Users can view and send messages in their matches
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (receiver_id = auth.uid());

-- Expertise Atlas: Users manage their own skills
CREATE POLICY "Users can view own expertise" ON expertise_atlas
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can manage own expertise" ON expertise_atlas
  FOR ALL USING (profile_id = auth.uid());

-- Proofs: Users manage their own proofs
CREATE POLICY "Users can view own proofs" ON proofs
  FOR SELECT USING (profile_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can manage own proofs" ON proofs
  FOR ALL USING (profile_id = auth.uid());

-- Verification Requests: Requesters can manage
CREATE POLICY "Users can view own verification requests" ON verification_requests
  FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create verification requests" ON verification_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Artifacts: Users manage their own artifacts
CREATE POLICY "Users can view own artifacts" ON artifacts
  FOR SELECT USING (profile_id = auth.uid() OR visibility = 'public');

CREATE POLICY "Users can manage own artifacts" ON artifacts
  FOR ALL USING (profile_id = auth.uid());

-- Analytics: Users can create events, admins can view all
CREATE POLICY "Anyone can create analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own analytics" ON analytics_events
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- Reports: Users can report, admins can manage
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expertise_updated_at BEFORE UPDATE ON expertise_atlas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proofs_updated_at BEFORE UPDATE ON proofs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- All tables, indexes, RLS policies, and triggers have been created.
-- You can now start using your Proofound MVP database!
