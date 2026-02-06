-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251107193929
-- name: add_web_vitals_metrics
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- ============================================================================
-- WEB VITALS METRICS TABLE
-- Stores Core Web Vitals for performance monitoring
-- PRD Reference: Part 8 NFR - Performance Monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS web_vitals_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_name TEXT NOT NULL CHECK (metric_name IN ('LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP')),
  value NUMERIC(10, 2) NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta NUMERIC(10, 2) NOT NULL,
  metric_id TEXT NOT NULL,
  navigation_type TEXT,
  page_path TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_vitals_created_at ON web_vitals_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_name ON web_vitals_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_page_path ON web_vitals_metrics(page_path);
CREATE INDEX IF NOT EXISTS idx_web_vitals_rating ON web_vitals_metrics(rating);
CREATE INDEX IF NOT EXISTS idx_web_vitals_user_id ON web_vitals_metrics(user_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_date 
  ON web_vitals_metrics(metric_name, created_at DESC);

-- Row-Level Security
ALTER TABLE web_vitals_metrics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (web vitals can be sent before auth)
CREATE POLICY "Allow anonymous web vitals recording"
  ON web_vitals_metrics FOR INSERT
  WITH CHECK (true);

-- Only admins can read web vitals
CREATE POLICY "Admins can read web vitals"
  ON web_vitals_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role IN ('platform_admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT INSERT ON web_vitals_metrics TO anon;
GRANT INSERT ON web_vitals_metrics TO authenticated;
GRANT SELECT ON web_vitals_metrics TO authenticated;
GRANT ALL ON web_vitals_metrics TO service_role;

-- Dashboard load time tracking table
CREATE TABLE IF NOT EXISTS dashboard_load_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_type TEXT NOT NULL, -- 'individual', 'organization', 'admin'
  load_time_ms INTEGER NOT NULL,
  tile_count INTEGER,
  data_fetch_time_ms INTEGER,
  render_time_ms INTEGER,
  page_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for dashboard load times
CREATE INDEX IF NOT EXISTS idx_dashboard_load_times_user_id ON dashboard_load_times(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_load_times_created_at ON dashboard_load_times(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_load_times_type ON dashboard_load_times(dashboard_type);

-- Row-Level Security
ALTER TABLE dashboard_load_times ENABLE ROW LEVEL SECURITY;

-- Users can insert their own dashboard load times
CREATE POLICY "Users can insert their dashboard load times"
  ON dashboard_load_times FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all dashboard load times
CREATE POLICY "Admins can read dashboard load times"
  ON dashboard_load_times FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.platform_role IN ('platform_admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT INSERT ON dashboard_load_times TO authenticated;
GRANT SELECT ON dashboard_load_times TO authenticated;
GRANT ALL ON dashboard_load_times TO service_role;
