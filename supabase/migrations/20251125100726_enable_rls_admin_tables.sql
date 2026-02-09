-- ============================================
-- ENABLE RLS ON ADMIN TABLES
-- ============================================
-- Migration: 20251125_enable_rls_admin_tables
-- Date: 2025-11-25
-- Purpose: Enable RLS and add policies for admin tables
-- Reference: PRD Part 8 - Security & Privacy Requirements
-- ============================================

-- ============================================
-- TABLE 9: admin_audit_log
-- ============================================

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Platform admins can read audit logs (read-only for transparency)
CREATE POLICY "admin_audit_log_admin_read"
  ON admin_audit_log FOR SELECT
  USING (is_platform_admin());

-- Only service role can insert (append-only audit trail)
-- No insert policy for authenticated users - only service_role can write
CREATE POLICY "admin_audit_log_service_insert"
  ON admin_audit_log FOR INSERT
  WITH CHECK (
    -- Only service role can insert
    current_setting('role', true) = 'service_role'
  );

-- No UPDATE or DELETE policies - audit logs are immutable

-- ============================================
-- TABLE 10: admin_invitations
-- ============================================

ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

-- Platform admins can read all invitations
CREATE POLICY "admin_invitations_admin_read"
  ON admin_invitations FOR SELECT
  USING (is_platform_admin());

-- Invited users can read their invitation by email
CREATE POLICY "admin_invitations_invitee_read"
  ON admin_invitations FOR SELECT
  USING (
    LOWER(email) = LOWER(auth.jwt() ->> 'email')
    AND status = 'pending'
    AND expires_at > NOW()
  );

-- Platform admins can create invitations
CREATE POLICY "admin_invitations_admin_insert"
  ON admin_invitations FOR INSERT
  WITH CHECK (is_platform_admin());

-- Platform admins can update invitations (cancel, etc.)
CREATE POLICY "admin_invitations_admin_update"
  ON admin_invitations FOR UPDATE
  USING (is_platform_admin());

-- Invitee can update their own invitation (accept)
CREATE POLICY "admin_invitations_invitee_update"
  ON admin_invitations FOR UPDATE
  USING (
    LOWER(email) = LOWER(auth.jwt() ->> 'email')
    AND status = 'pending'
    AND expires_at > NOW()
  )
  WITH CHECK (
    -- Can only accept (change status to accepted)
    status IN ('pending', 'accepted')
  );

-- Platform admins can delete invitations
CREATE POLICY "admin_invitations_admin_delete"
  ON admin_invitations FOR DELETE
  USING (is_platform_admin());

-- ============================================
-- TABLE 11: admin_metrics_cache
-- ============================================

ALTER TABLE admin_metrics_cache ENABLE ROW LEVEL SECURITY;

-- Platform admins can read metrics
CREATE POLICY "admin_metrics_cache_admin_read"
  ON admin_metrics_cache FOR SELECT
  USING (is_platform_admin());

-- Only service role can insert/update (cron jobs)
CREATE POLICY "admin_metrics_cache_service_insert"
  ON admin_metrics_cache FOR INSERT
  WITH CHECK (
    current_setting('role', true) = 'service_role'
  );

CREATE POLICY "admin_metrics_cache_service_update"
  ON admin_metrics_cache FOR UPDATE
  USING (
    current_setting('role', true) = 'service_role'
  );

CREATE POLICY "admin_metrics_cache_service_delete"
  ON admin_metrics_cache FOR DELETE
  USING (
    current_setting('role', true) = 'service_role'
  );

-- ============================================
-- TABLE 12: metric_snapshots
-- ============================================

ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;

-- Platform admins can read snapshots
CREATE POLICY "metric_snapshots_admin_read"
  ON metric_snapshots FOR SELECT
  USING (is_platform_admin());

-- Only service role can insert (ETL jobs)
CREATE POLICY "metric_snapshots_service_insert"
  ON metric_snapshots FOR INSERT
  WITH CHECK (
    current_setting('role', true) = 'service_role'
  );

-- Service role can update/delete for maintenance
CREATE POLICY "metric_snapshots_service_update"
  ON metric_snapshots FOR UPDATE
  USING (
    current_setting('role', true) = 'service_role'
  );

CREATE POLICY "metric_snapshots_service_delete"
  ON metric_snapshots FOR DELETE
  USING (
    current_setting('role', true) = 'service_role'
  );

-- ============================================
-- TABLE 13: fairness_reports
-- ============================================

ALTER TABLE fairness_reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read published fairness reports (transparency)
CREATE POLICY "fairness_reports_public_read"
  ON fairness_reports FOR SELECT
  USING (
    published_at IS NOT NULL
    OR is_platform_admin()
  );

-- Only platform admins can create/modify reports
CREATE POLICY "fairness_reports_admin_insert"
  ON fairness_reports FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "fairness_reports_admin_update"
  ON fairness_reports FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "fairness_reports_admin_delete"
  ON fairness_reports FOR DELETE
  USING (is_platform_admin());

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  tables_to_check TEXT[] := ARRAY[
    'admin_audit_log',
    'admin_invitations',
    'admin_metrics_cache',
    'metric_snapshots',
    'fairness_reports'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_check
  LOOP
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      RAISE EXCEPTION 'RLS not enabled on table: %', tbl;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'RLS verification passed for all 5 admin tables';
END $$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Admin audit log - read-only for authenticated, full for service_role
GRANT SELECT ON admin_audit_log TO authenticated;
GRANT ALL ON admin_audit_log TO service_role;

-- Admin invitations
GRANT SELECT, UPDATE ON admin_invitations TO authenticated;
GRANT ALL ON admin_invitations TO service_role;

-- Metrics tables - read for authenticated, full for service_role
GRANT SELECT ON admin_metrics_cache TO authenticated;
GRANT ALL ON admin_metrics_cache TO service_role;

GRANT SELECT ON metric_snapshots TO authenticated;
GRANT ALL ON metric_snapshots TO service_role;

-- Fairness reports - read for authenticated, full for service_role
GRANT SELECT ON fairness_reports TO authenticated;
GRANT ALL ON fairness_reports TO service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

