-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251025222234
-- name: consolidate_audit_logs_policies
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Phase 2: Consolidate Multiple Permissive Policies
-- Replace two separate audit_logs policies with one optimized policy

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org members can view org audit logs" ON public.audit_logs;

CREATE POLICY "Users can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        (select auth.uid()) = actor_id 
        OR 
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = audit_logs.org_id
            AND om.user_id = (select auth.uid())
            AND om.status = 'active'
        )
    );
