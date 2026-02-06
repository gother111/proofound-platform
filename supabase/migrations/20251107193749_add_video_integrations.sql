-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251107193749
-- name: add_video_integrations
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Video Provider Integrations
-- Stores OAuth tokens for Zoom and Google Meet

CREATE TABLE IF NOT EXISTS user_video_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('zoom', 'google_meet')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Only one integration per user per provider
  UNIQUE(user_id, provider)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_integrations_user ON user_video_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_integrations_provider ON user_video_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_video_integrations_expiry ON user_video_integrations(token_expiry);

-- RLS Policies
ALTER TABLE user_video_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own integrations
CREATE POLICY "Users can manage own video integrations"
  ON user_video_integrations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_video_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_integrations_updated_at
  BEFORE UPDATE ON user_video_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_video_integrations_updated_at();
