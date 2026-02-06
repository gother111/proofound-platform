-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251107193937
-- name: add_profile_snippets
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- ============================================================================
-- PROFILE SNIPPETS TABLES
-- Shareable public profile links with privacy controls
-- PRD Reference: Part 2 F2 - Data Portability
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  theme TEXT NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
  format TEXT NOT NULL DEFAULT 'card' CHECK (format IN ('card', 'mini', 'full')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profile snippet views (analytics)
CREATE TABLE IF NOT EXISTS profile_snippet_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES profile_snippets(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profile_snippets_user_id ON profile_snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_snippets_share_token ON profile_snippets(share_token);
CREATE INDEX IF NOT EXISTS idx_profile_snippets_expires_at ON profile_snippets(expires_at);
CREATE INDEX IF NOT EXISTS idx_profile_snippet_views_snippet_id ON profile_snippet_views(snippet_id);
CREATE INDEX IF NOT EXISTS idx_profile_snippet_views_viewed_at ON profile_snippet_views(viewed_at DESC);

-- Row-Level Security
ALTER TABLE profile_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_snippet_views ENABLE ROW LEVEL SECURITY;

-- Users can manage their own snippets
CREATE POLICY "Users can manage their snippets"
  ON profile_snippets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view snippet views (for the public profile page)
CREATE POLICY "Public can view snippet views"
  ON profile_snippet_views FOR SELECT
  USING (true);

-- System can insert snippet views
CREATE POLICY "System can insert snippet views"
  ON profile_snippet_views FOR INSERT
  WITH CHECK (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_profile_snippets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_snippets_updated_at
  BEFORE UPDATE ON profile_snippets
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_snippets_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON profile_snippets TO authenticated;
GRANT SELECT, INSERT ON profile_snippet_views TO authenticated;
GRANT SELECT ON profile_snippet_views TO anon;
GRANT INSERT ON profile_snippet_views TO anon;
GRANT ALL ON profile_snippets TO service_role;
GRANT ALL ON profile_snippet_views TO service_role;
