-- Migration: Saved Searches & Smart Alerts for Individuals
-- Created: 2025-12-06
-- Purpose: Support saved searches, organization follows, and rank history for smart alerts

-- ============================================================================
-- 1. SAVED SEARCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Filter criteria
  causes TEXT[] DEFAULT '{}',
  values_tags TEXT[] DEFAULT '{}',
  location_mode TEXT,
  country TEXT,
  city TEXT,
  comp_min INTEGER,
  comp_max INTEGER,
  hours_min INTEGER,
  hours_max INTEGER,
  industries TEXT[] DEFAULT '{}',
  -- Notification settings
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  alert_threshold NUMERIC(3,2) DEFAULT 0.75,
  alert_frequency TEXT DEFAULT 'immediate',
  last_alerted_at TIMESTAMPTZ,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_enabled ON saved_searches(alert_enabled) WHERE alert_enabled = true;

-- ============================================================================
-- 2. ORGANIZATION FOLLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  notify_new_roles BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_org_follows_user ON organization_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_org_follows_org ON organization_follows(org_id);

-- ============================================================================
-- 3. MATCH RANK HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rank_history_match ON match_rank_history(match_id);
CREATE INDEX IF NOT EXISTS idx_rank_history_recorded ON match_rank_history(recorded_at);

-- ============================================================================
-- 4. NOTIFICATION PREFERENCES (SMART ALERT CHANNELS)
-- ============================================================================

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_new_match_alert BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_rank_improved BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_followed_org_new_role BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_new_match_alert BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_rank_improved BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_followed_org_new_role BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- DONE
-- ============================================================================


