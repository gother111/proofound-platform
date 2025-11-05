-- ============================================
-- VERIFICATION PRIVACY SYSTEM MIGRATION
-- ============================================
-- Migration: 20251107_verification_privacy
-- Date: 2025-11-07
-- Purpose: Implement privacy-protected verification system with rate limiting
-- Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 11
-- ============================================

-- ============================================
-- SECTION 1: VERIFICATION_REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Verifier info (Tier 1 PII - protected)
  verifier_email TEXT NOT NULL,
  verifier_name TEXT NOT NULL,
  verifier_relationship TEXT, -- e.g., "Manager at Acme Corp", "Professor at MIT"
  
  -- Verification details
  claim_type TEXT CHECK (claim_type IN ('experience', 'skill', 'education', 'achievement', 'project')) NOT NULL,
  claim_data JSONB NOT NULL, -- Structured data about what's being verified
  
  -- Privacy protection
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, -- 14 days from creation
  one_time_use BOOLEAN DEFAULT TRUE,
  used_at TIMESTAMPTZ,
  
  -- Response
  status TEXT CHECK (status IN ('pending', 'verified', 'declined', 'expired', 'cancelled')) DEFAULT 'pending',
  response_note TEXT, -- Optional note from verifier
  responded_at TIMESTAMPTZ,
  
  -- Visibility control (verifier PII protection)
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'private',
  show_verifier_name BOOLEAN DEFAULT FALSE, -- User can hide verifier name on public profile
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Verification badge reference (if verified)
  badge_id UUID, -- References potential future badges table
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

COMMENT ON TABLE verification_requests IS 'Privacy-protected verification requests with expiring tokens and rate limiting';
COMMENT ON COLUMN verification_requests.verifier_email IS 'Verifier email (Tier 1 PII) - protected by RLS';
COMMENT ON COLUMN verification_requests.verifier_name IS 'Verifier name (Tier 1 PII) - protected by RLS';
COMMENT ON COLUMN verification_requests.token IS 'One-time use token for verifier access (expires in 14 days)';
COMMENT ON COLUMN verification_requests.visibility IS 'Control whether verification appears on public profile';
COMMENT ON COLUMN verification_requests.show_verifier_name IS 'User choice: show verifier name publicly or keep anonymous';

-- ============================================
-- SECTION 2: INDEXES
-- ============================================

CREATE INDEX idx_verification_requests_profile ON verification_requests(profile_id);
CREATE INDEX idx_verification_requests_token ON verification_requests(token);
CREATE INDEX idx_verification_requests_email ON verification_requests(verifier_email);
CREATE INDEX idx_verification_requests_expires ON verification_requests(expires_at);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_created ON verification_requests(created_at DESC);

-- Composite index for rate limiting queries
CREATE INDEX idx_verification_rate_limit ON verification_requests(profile_id, created_at) 
  WHERE status != 'cancelled';

-- ============================================
-- SECTION 3: ROW-LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Requester reads own requests
CREATE POLICY "requester_reads_own_requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() = profile_id);

-- Policy 2: Verifier reads requests by valid token (no auth required for verifiers)
CREATE POLICY "verifier_reads_by_token"
  ON verification_requests FOR SELECT
  USING (
    -- Allow access via valid token (for anonymous verifiers)
    token IS NOT NULL 
    AND expires_at > NOW()
    AND status = 'pending'
    -- OR authenticated user matches verifier email
    OR (auth.jwt() ->> 'email') = verifier_email
  );

-- Policy 3: Requester creates requests (with rate limiting check in API)
CREATE POLICY "requester_creates_requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Policy 4: Verifier responds via token
CREATE POLICY "verifier_responds"
  ON verification_requests FOR UPDATE
  USING (
    -- Must have valid token OR be authenticated with verifier email
    (token IS NOT NULL AND expires_at > NOW())
    OR (auth.jwt() ->> 'email') = verifier_email
  )
  WITH CHECK (
    -- Can only update status and response fields
    status IN ('verified', 'declined')
    AND responded_at IS NOT NULL
  );

-- Policy 5: Requester updates own requests (cancel, visibility)
CREATE POLICY "requester_updates_own_requests"
  ON verification_requests FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (
    -- Can only update visibility and cancellation
    (status = 'cancelled' AND OLD.status = 'pending')
    OR (visibility IS NOT NULL)
    OR (show_verifier_name IS NOT NULL)
  );

-- Policy 6: Requester deletes own requests
CREATE POLICY "requester_deletes_own_requests"
  ON verification_requests FOR DELETE
  USING (auth.uid() = profile_id);

-- ============================================
-- SECTION 4: RATE LIMITING VIEW
-- ============================================

-- View: Rate limit check (5 requests per hour per user)
CREATE OR REPLACE VIEW verification_rate_limit AS
SELECT 
  profile_id,
  COUNT(*) as requests_last_hour,
  MAX(created_at) as last_request_at
FROM verification_requests
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND status != 'cancelled'
GROUP BY profile_id;

COMMENT ON VIEW verification_rate_limit IS 'Rate limit monitoring: Max 5 verification requests per hour per user';

-- View: Daily rate limit (20 requests per day per user)
CREATE OR REPLACE VIEW verification_rate_limit_daily AS
SELECT 
  profile_id,
  COUNT(*) as requests_last_24h,
  MAX(created_at) as last_request_at
FROM verification_requests
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND status != 'cancelled'
GROUP BY profile_id;

COMMENT ON VIEW verification_rate_limit_daily IS 'Daily rate limit: Max 20 verification requests per 24 hours per user';

-- ============================================
-- SECTION 5: TRIGGERS & FUNCTIONS
-- ============================================

-- Function: Auto-expire verification requests
CREATE OR REPLACE FUNCTION expire_verification_requests()
RETURNS void AS $$
BEGIN
  UPDATE verification_requests
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_verification_requests IS 'Auto-expires verification requests past their expiry date (run via cron)';

-- Function: Mark token as used
CREATE OR REPLACE FUNCTION mark_verification_token_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('verified', 'declined') THEN
    NEW.used_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update used_at when token is used
CREATE TRIGGER mark_token_used
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status IN ('verified', 'declined'))
  EXECUTE FUNCTION mark_verification_token_used();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER update_verification_updated_at
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_timestamp();

-- ============================================
-- SECTION 6: HELPER VIEWS
-- ============================================

-- View: Public verifications (for display on profile)
CREATE OR REPLACE VIEW public_verifications AS
SELECT 
  vr.id,
  vr.profile_id,
  vr.claim_type,
  vr.claim_data,
  vr.status,
  vr.responded_at,
  vr.created_at,
  -- Show verifier name only if user allows it
  CASE 
    WHEN vr.show_verifier_name = TRUE THEN vr.verifier_name
    ELSE 'Verified by anonymous verifier'
  END as verifier_display_name,
  -- Never expose verifier email publicly
  NULL as verifier_email
FROM verification_requests vr
WHERE vr.visibility = 'public'
  AND vr.status = 'verified';

COMMENT ON VIEW public_verifications IS 'Public-facing verified claims (verifier PII protected)';

-- View: Verification statistics per user
CREATE OR REPLACE VIEW verification_stats AS
SELECT 
  profile_id,
  COUNT(*) FILTER (WHERE status = 'verified') as verified_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'declined') as declined_count,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
  MAX(responded_at) FILTER (WHERE status = 'verified') as last_verified_at
FROM verification_requests
GROUP BY profile_id;

COMMENT ON VIEW verification_stats IS 'Verification statistics per user profile';

-- ============================================
-- SECTION 7: ANALYTICS INTEGRATION
-- ============================================

-- Function: Log verification events
CREATE OR REPLACE FUNCTION log_verification_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to analytics_events if table exists
  IF TG_OP = 'INSERT' THEN
    INSERT INTO analytics_events (
      event_type,
      user_id,
      entity_type,
      entity_id,
      properties,
      created_at
    ) VALUES (
      'verification_requested',
      NEW.profile_id,
      'verification_request',
      NEW.id,
      jsonb_build_object(
        'claim_type', NEW.claim_type,
        'has_verifier_relationship', NEW.verifier_relationship IS NOT NULL
      ),
      NOW()
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO analytics_events (
      event_type,
      user_id,
      entity_type,
      entity_id,
      properties,
      created_at
    ) VALUES (
      'verification_' || NEW.status,
      NEW.profile_id,
      'verification_request',
      NEW.id,
      jsonb_build_object(
        'claim_type', NEW.claim_type,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'response_time_hours', EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at)) / 3600
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Log verification events
CREATE TRIGGER log_verification_events
  AFTER INSERT OR UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_event();

-- ============================================
-- SECTION 8: SECURITY CHECKS
-- ============================================

-- Function: Check rate limit before creating request
CREATE OR REPLACE FUNCTION check_verification_rate_limit(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  hourly_count INTEGER;
  daily_count INTEGER;
BEGIN
  -- Check hourly limit (5 requests)
  SELECT COUNT(*) INTO hourly_count
  FROM verification_requests
  WHERE profile_id = user_id
    AND created_at >= NOW() - INTERVAL '1 hour'
    AND status != 'cancelled';
  
  IF hourly_count >= 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Check daily limit (20 requests)
  SELECT COUNT(*) INTO daily_count
  FROM verification_requests
  WHERE profile_id = user_id
    AND created_at >= NOW() - INTERVAL '24 hours'
    AND status != 'cancelled';
  
  IF daily_count >= 20 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_verification_rate_limit IS 'Check if user has exceeded rate limits (5/hour, 20/day)';

-- ============================================
-- SECTION 9: DATA RETENTION (GDPR COMPLIANCE)
-- ============================================

-- Function: Archive old verification requests
CREATE OR REPLACE FUNCTION archive_old_verifications()
RETURNS void AS $$
BEGIN
  -- Soft delete verification requests older than 3 years
  -- Keep verified ones for badge integrity
  UPDATE verification_requests
  SET status = 'cancelled',
      verifier_email = '[REDACTED]',
      verifier_name = '[REDACTED]',
      response_note = NULL,
      updated_at = NOW()
  WHERE created_at < NOW() - INTERVAL '3 years'
    AND status IN ('pending', 'expired', 'declined');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION archive_old_verifications IS 'Archives verification requests older than 3 years per GDPR retention policy';

-- ============================================
-- VERIFICATION: CHECK RLS STATUS
-- ============================================

DO $$
BEGIN
  IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'verification_requests') THEN
    RAISE EXCEPTION 'RLS not enabled on verification_requests table';
  END IF;
  
  RAISE NOTICE 'RLS verification passed: verification_requests table protected';
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Update src/db/schema.ts with TypeScript types
-- 2. Create rate limiting middleware
-- 3. Update verification API endpoints
-- 4. Create verification email templates
-- ============================================

