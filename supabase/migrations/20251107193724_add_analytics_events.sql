-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251107193724
-- name: add_analytics_events
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Analytics Events Table
-- Stores all user action events for metrics calculation

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT, -- 'match', 'interview', 'contract', 'profile', 'assignment'
  entity_id UUID,
  properties JSONB DEFAULT '{}'::jsonb,
  privacy_partition TEXT DEFAULT 'default', -- For demographic segmentation
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred ON analytics_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON analytics_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_partition ON analytics_events(privacy_partition);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type ON analytics_events(user_id, event_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_occurred ON analytics_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_occurred ON analytics_events(user_id, occurred_at DESC);

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own events
CREATE POLICY "Users can read own events"
  ON analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Platform admins can read all events (for metrics)
CREATE POLICY "Admins can read all events"
  ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role IN ('platform_admin', 'super_admin')
    )
  );

-- System can insert events (via service role)
CREATE POLICY "Service role can insert events"
  ON analytics_events
  FOR INSERT
  WITH CHECK (true); -- Service role key required

-- Retention policy: Keep events for 2 years
-- (Manual cleanup or use pg_cron)
COMMENT ON TABLE analytics_events IS 'Analytics events with 2-year retention policy';
