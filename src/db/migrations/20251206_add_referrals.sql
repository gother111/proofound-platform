-- Migration: Referral & Endorsement System
-- Created: 2025-12-06
-- Purpose: Add referrals, referral credits, and notification preference fields

-- ============================================================================
-- 1. REFERRALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_type TEXT NOT NULL CHECK (referral_type IN ('platform', 'assignment')),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'hired', 'expired')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '45 days'),
  CONSTRAINT referrals_assignment_required CHECK (
    (referral_type = 'assignment' AND assignment_id IS NOT NULL)
    OR (referral_type = 'platform' AND assignment_id IS NULL)
  )
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_assignment ON referrals(assignment_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_expires_at ON referrals(expires_at);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_referrals_updated_at ON referrals;
CREATE TRIGGER trg_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referrals_updated_at();

-- ============================================================================
-- 2. REFERRAL CREDITS TABLE (non-monetary, future-ready)
-- ============================================================================

CREATE TABLE IF NOT EXISTS referral_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('signup_bonus', 'hire_bonus')),
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired')),
  credited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_credits_unique_type UNIQUE (referral_id, credit_type)
);

CREATE INDEX IF NOT EXISTS idx_referral_credits_referrer ON referral_credits(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_status ON referral_credits(status);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;

-- Referrers or referred users can read their referrals
CREATE POLICY "referrals_read_participants" ON referrals
  FOR SELECT USING (
    referrer_id = auth.uid()
    OR referred_user_id = auth.uid()
  );

-- Referrers can create referrals for themselves
CREATE POLICY "referrals_insert_self" ON referrals
  FOR INSERT WITH CHECK (referrer_id = auth.uid());

-- Participants can update referral status (e.g., acceptance / cancel)
CREATE POLICY "referrals_update_participants" ON referrals
  FOR UPDATE USING (
    referrer_id = auth.uid()
    OR referred_user_id = auth.uid()
  );

-- Referrers can cancel (delete) their referrals
CREATE POLICY "referrals_delete_referrer" ON referrals
  FOR DELETE USING (referrer_id = auth.uid());

-- Credits are visible to the referrer
CREATE POLICY "referral_credits_read_owner" ON referral_credits
  FOR SELECT USING (referrer_id = auth.uid());

-- Credits can be created by the referrer (service role bypasses RLS)
CREATE POLICY "referral_credits_insert_owner" ON referral_credits
  FOR INSERT WITH CHECK (referrer_id = auth.uid());

-- ============================================================================
-- 4. NOTIFICATION PREFERENCES EXTENSION
-- ============================================================================
-- Add per-channel preferences for referral/endorsement notification types

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_referral_received BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_referral_accepted BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_referral_signed_up BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_endorsement_received BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_referral_received BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_referral_accepted BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_referral_signed_up BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_endorsement_received BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- 5. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON referrals TO authenticated;
GRANT SELECT ON referral_credits TO authenticated;
GRANT ALL ON referrals TO service_role;
GRANT ALL ON referral_credits TO service_role;

-- ============================================================================
-- DONE
-- ============================================================================

