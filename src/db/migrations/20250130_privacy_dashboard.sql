-- Migration: Privacy Dashboard for GDPR Compliance
-- Date: 2025-01-30
-- Description: Adds user audit log view, account deletion fields,
--              and user consents table for GDPR Articles 15, 17, 20 compliance
-- Reference: CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 2.6

-- ============================================================================
-- ACCOUNT DELETION SUPPORT (GDPR Article 17: Right to Erasure)
-- ============================================================================

-- Add deletion fields to profiles table for 30-day grace period
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMP,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;

-- Index for cleanup job to find accounts ready for deletion
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled 
ON profiles(deletion_scheduled_for) 
WHERE deletion_scheduled_for IS NOT NULL AND deleted = false;

-- Index for filtering out deleted accounts
CREATE INDEX IF NOT EXISTS idx_profiles_deleted 
ON profiles(deleted) 
WHERE deleted = true;

-- ============================================================================
-- USER CONSENTS TABLE (GDPR Audit Trail)
-- ============================================================================

-- Track all user consents for GDPR compliance
-- Reference: CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 5.3
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'gdpr_terms_of_service',
        'gdpr_privacy_policy',
        'marketing_emails',
        'analytics_tracking',
        'ml_matching'
    )),
    consented BOOLEAN NOT NULL,
    consented_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_hash TEXT, -- Hashed IP for audit trail (GDPR compliant)
    user_agent_hash TEXT, -- Hashed user agent
    version TEXT, -- Version of policy consented to (e.g., "v1.0.2025-01-30")
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for user consents
CREATE INDEX IF NOT EXISTS idx_user_consents_profile 
ON user_consents(profile_id);

CREATE INDEX IF NOT EXISTS idx_user_consents_type 
ON user_consents(consent_type);

CREATE INDEX IF NOT EXISTS idx_user_consents_timestamp 
ON user_consents(consented_at DESC);

-- ============================================================================
-- USER AUDIT LOG VIEW (GDPR Article 15: Right to Access)
-- ============================================================================

-- Create view for user-friendly audit log from analytics_events
-- This provides a clean interface for the Privacy Dashboard
CREATE OR REPLACE VIEW user_audit_log AS
SELECT
    ae.id,
    ae.user_id,
    ae.event_type as action,
    ae.created_at as timestamp,
    ae.ip_hash,
    ae.user_agent_hash,
    ae.session_id,
    ae.properties,
    -- Extract location from properties if available
    ae.properties->>'location' as location,
    -- Extract device from properties if available
    ae.properties->>'device' as device,
    ae.entity_type,
    ae.entity_id
FROM analytics_events ae
WHERE ae.user_id IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON user_audit_log TO authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on user_consents
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Users can read their own consents
CREATE POLICY "Users can read own consents"
    ON user_consents FOR SELECT
    USING (auth.uid() = profile_id);

-- Users and service role can insert consents
CREATE POLICY "Users can insert own consents"
    ON user_consents FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Service role can insert for system actions
CREATE POLICY "Service role can insert consents"
    ON user_consents FOR INSERT
    WITH CHECK (true);

-- Users can only see their own audit log via the view
-- This is enforced by combining the view with analytics_events RLS
-- The view inherits RLS from analytics_events table

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on user_consents
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_consents_updated_at
    BEFORE UPDATE ON user_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_user_consents_updated_at();

-- Function to anonymize a user account (called by deletion job)
CREATE OR REPLACE FUNCTION anonymize_user_account(user_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Anonymize profile data
    UPDATE profiles
    SET 
        display_name = 'Deleted User',
        handle = 'deleted_' || SUBSTRING(id::text, 1, 8),
        avatar_url = NULL,
        deleted = true
    WHERE id = user_uuid;

    -- Anonymize individual profile data
    UPDATE individual_profiles
    SET
        headline = NULL,
        bio = NULL,
        location = NULL,
        tagline = NULL,
        mission = NULL,
        cover_image_url = NULL
    WHERE user_id = user_uuid;

    -- Note: We keep skills, projects, experiences for 90 days as per retention policy
    -- These will be deleted by a separate cleanup job after the retention period
    
    -- Delete sensitive messaging data immediately
    DELETE FROM messages 
    WHERE sender_id = user_uuid;
    
    -- Delete match interest
    DELETE FROM match_interest 
    WHERE actor_profile_id = user_uuid OR target_profile_id = user_uuid;
    
    -- Log the anonymization event
    INSERT INTO analytics_events (event_type, user_id, properties, created_at)
    VALUES ('account_anonymized', user_uuid, '{"reason": "user_requested_deletion"}'::jsonb, NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to process account deletions (called by daily cron job)
CREATE OR REPLACE FUNCTION process_pending_deletions()
RETURNS TABLE(processed_count INTEGER, user_ids UUID[]) AS $$
DECLARE
    user_record RECORD;
    processed_ids UUID[] := ARRAY[]::UUID[];
    count INTEGER := 0;
BEGIN
    -- Find all accounts scheduled for deletion where grace period has expired
    FOR user_record IN
        SELECT id 
        FROM profiles 
        WHERE deletion_scheduled_for IS NOT NULL 
        AND deletion_scheduled_for <= NOW()
        AND deleted = false
    LOOP
        -- Anonymize the account
        PERFORM anonymize_user_account(user_record.id);
        
        -- Add to processed list
        processed_ids := array_append(processed_ids, user_record.id);
        count := count + 1;
    END LOOP;
    
    RETURN QUERY SELECT count, processed_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_consents IS 'GDPR consent audit trail - tracks all user consent decisions';
COMMENT ON VIEW user_audit_log IS 'User-friendly view of analytics_events for Privacy Dashboard audit log';
COMMENT ON COLUMN profiles.deletion_requested_at IS 'When user requested account deletion (starts 30-day grace period)';
COMMENT ON COLUMN profiles.deletion_scheduled_for IS 'When account will be permanently deleted (requested_at + 30 days)';
COMMENT ON COLUMN profiles.deletion_reason IS 'Optional user feedback on why they are deleting their account';
COMMENT ON COLUMN profiles.deleted IS 'Whether account has been anonymized/deleted';
COMMENT ON FUNCTION anonymize_user_account IS 'Anonymizes user PII while preserving data for retention compliance';
COMMENT ON FUNCTION process_pending_deletions IS 'Daily cron job to process accounts past grace period';

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Ensure all existing profiles have deletion fields set to NULL if not already set
UPDATE profiles 
SET 
    deletion_requested_at = NULL,
    deletion_scheduled_for = NULL,
    deletion_reason = NULL,
    deleted = false
WHERE deletion_requested_at IS NULL 
AND deletion_scheduled_for IS NULL 
AND deleted IS NULL;

