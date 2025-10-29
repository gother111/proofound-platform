-- Migration: Add Verification, Messaging, and Moderation Systems
-- Date: 2025-01-29
-- Description: Adds tables for verification workflow, post-match messaging,
--              content moderation, and analytics as required by PRD

-- ============================================================================
-- VERIFICATION SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_type TEXT NOT NULL CHECK (claim_type IN ('experience', 'education', 'volunteering', 'impact_story', 'capability')),
    claim_id UUID NOT NULL,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    verifier_email TEXT NOT NULL,
    verifier_name TEXT,
    verifier_org TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cannot_verify', 'expired', 'appealed')),
    token TEXT UNIQUE NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_nudged_at TIMESTAMP,
    responded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    response_type TEXT NOT NULL CHECK (response_type IN ('accept', 'decline', 'cannot_verify')),
    reason TEXT,
    verifier_seniority INTEGER,
    notes TEXT,
    ip_address TEXT,
    user_agent TEXT,
    responded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    context TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
    reviewer_id UUID REFERENCES profiles(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('domain_email', 'website', 'registry', 'manual')),
    domain TEXT,
    registry_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MESSAGING SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID UNIQUE NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    participant_one_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_two_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stage INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_system_message BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP,
    flagged_for_moderation BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocked_users (
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- ============================================================================
-- MODERATION & SAFETY SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('profile', 'message', 'assignment', 'impact_story', 'experience', 'education', 'volunteering')),
    content_id UUID NOT NULL,
    content_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('spam', 'harassment', 'misinformation', 'inappropriate', 'political', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'actioned', 'dismissed')),
    ai_flag BOOLEAN NOT NULL DEFAULT false,
    ai_confidence NUMERIC,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES content_reports(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'content_removed', 'account_suspended', 'dismissed')),
    reason TEXT NOT NULL,
    is_appealable BOOLEAN NOT NULL DEFAULT true,
    appeal_deadline TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES content_reports(id) ON DELETE SET NULL,
    violation_type TEXT NOT NULL CHECK (violation_type IN ('spam', 'harassment', 'misinformation', 'inappropriate', 'political', 'other')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    action_taken TEXT NOT NULL CHECK (action_taken IN ('warning', 'content_removed', 'timed_suspension', 'permanent_ban')),
    suspension_expires_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS & SUPPORTING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type TEXT,
    entity_id UUID,
    properties JSONB DEFAULT '{}'::jsonb,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS editorial_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    curator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    notes TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('add_proof', 'add_skill', 'update_value', 'complete_profile')),
    description TEXT NOT NULL,
    estimated_impact NUMERIC NOT NULL,
    action_url TEXT,
    is_dismissed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_ties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tie_type TEXT NOT NULL CHECK (tie_type IN ('match', 'verification', 'endorsement', 'conversation')),
    related_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    related_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    strength NUMERIC NOT NULL,
    last_interaction_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_legacy BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Verification indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_profile ON verification_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_token ON verification_requests(token);
CREATE INDEX IF NOT EXISTS idx_verification_responses_request ON verification_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_org_verification_org ON org_verification(org_id);
CREATE INDEX IF NOT EXISTS idx_org_verification_status ON org_verification(status);

-- Messaging indexes
CREATE INDEX IF NOT EXISTS idx_conversations_match ON conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON conversations(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON conversations(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- Moderation indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_owner ON content_reports(content_owner_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON moderation_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_user_violations_user ON user_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_violations_created ON user_violations(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_editorial_matches_assignment ON editorial_matches(assignment_id);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_match ON match_suggestions(match_id);
CREATE INDEX IF NOT EXISTS idx_active_ties_user ON active_ties(user_id);
CREATE INDEX IF NOT EXISTS idx_active_ties_interaction ON active_ties(last_interaction_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_ties ENABLE ROW LEVEL SECURITY;

-- Verification RLS Policies
CREATE POLICY "Users can view their own verification requests" ON verification_requests
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can create verification requests for their claims" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Verifiers can view requests via token" ON verification_requests
    FOR SELECT USING (true); -- Public access via token, controlled in app layer

CREATE POLICY "Users can view responses to their requests" ON verification_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM verification_requests vr
            WHERE vr.id = request_id AND vr.profile_id = auth.uid()
        )
    );

CREATE POLICY "Users can create verification appeals" ON verification_appeals
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can view their own appeals" ON verification_appeals
    FOR SELECT USING (auth.uid() = profile_id);

-- Organization verification policies
CREATE POLICY "Org members can view org verification" ON org_verification
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = org_verification.org_id AND om.user_id = auth.uid()
        )
    );

-- Messaging RLS Policies
CREATE POLICY "Participants can view their conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = participant_one_id OR auth.uid() = participant_two_id
    );

CREATE POLICY "Participants can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
        )
    );

CREATE POLICY "Participants can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their block list" ON blocked_users
    FOR ALL USING (auth.uid() = blocker_id);

-- Moderation RLS Policies
CREATE POLICY "Users can create content reports" ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- Analytics RLS (mostly service role only)
CREATE POLICY "Service role full access to analytics" ON analytics_events
    USING (true);

CREATE POLICY "Users can view suggestions for their matches" ON match_suggestions
    FOR SELECT USING (auth.uid() = profile_id);

-- Active ties (private, algorithm use only)
CREATE POLICY "Service role full access to active ties" ON active_ties
    USING (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.sent_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Mark ties as legacy after 60 days
CREATE OR REPLACE FUNCTION mark_legacy_ties()
RETURNS void AS $$
BEGIN
    UPDATE active_ties
    SET is_legacy = true
    WHERE last_interaction_at < NOW() - INTERVAL '60 days'
    AND is_legacy = false;
END;
$$ LANGUAGE plpgsql;

-- Auto-expire verification requests
CREATE OR REPLACE FUNCTION expire_verification_requests()
RETURNS void AS $$
BEGIN
    UPDATE verification_requests
    SET status = 'expired'
    WHERE expires_at < NOW()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE verification_requests IS 'Tracks verification requests sent to referees for proof validation';
COMMENT ON TABLE verification_responses IS 'Stores referee responses to verification requests';
COMMENT ON TABLE verification_appeals IS 'User appeals for declined verifications';
COMMENT ON TABLE org_verification IS 'Organization domain and entity verification';
COMMENT ON TABLE conversations IS 'Post-match message threads with staged identity reveal';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE blocked_users IS 'User blocking relationships';
COMMENT ON TABLE content_reports IS 'User and AI-flagged content for moderation';
COMMENT ON TABLE moderation_actions IS 'Actions taken by moderators on reported content';
COMMENT ON TABLE user_violations IS 'Violation history per user for warning/suspension tracking';
COMMENT ON TABLE analytics_events IS 'Event tracking for North Star metrics';
COMMENT ON TABLE editorial_matches IS 'Curated matches for cold-start assignments';
COMMENT ON TABLE match_suggestions IS 'Improvement tips for users based on matches';
COMMENT ON TABLE active_ties IS 'Cluster snapshot of active relationships (private, algorithm use)';
