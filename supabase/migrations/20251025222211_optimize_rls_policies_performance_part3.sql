-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251025222211
-- name: optimize_rls_policies_performance_part3
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Continue optimizing RLS policies for performance (Part 3)

-- Drop and recreate skill_endorsements policies
DROP POLICY IF EXISTS "Owners and endorsers can view endorsements" ON public.skill_endorsements;
DROP POLICY IF EXISTS "Endorsers can insert endorsements" ON public.skill_endorsements;
DROP POLICY IF EXISTS "Owners and endorsers can update endorsements" ON public.skill_endorsements;
DROP POLICY IF EXISTS "Owners can delete endorsements" ON public.skill_endorsements;

CREATE POLICY "Owners and endorsers can view endorsements" ON public.skill_endorsements
    FOR SELECT USING (
        (select auth.uid()) = owner_profile_id 
        OR (select auth.uid()) = endorser_profile_id
    );

CREATE POLICY "Endorsers can insert endorsements" ON public.skill_endorsements
    FOR INSERT WITH CHECK ((select auth.uid()) = endorser_profile_id);

CREATE POLICY "Owners and endorsers can update endorsements" ON public.skill_endorsements
    FOR UPDATE USING (
        (select auth.uid()) = owner_profile_id 
        OR (select auth.uid()) = endorser_profile_id
    )
    WITH CHECK (
        (select auth.uid()) = owner_profile_id 
        OR (select auth.uid()) = endorser_profile_id
    );

CREATE POLICY "Owners can delete endorsements" ON public.skill_endorsements
    FOR DELETE USING ((select auth.uid()) = owner_profile_id);

-- Drop and recreate growth_plans policies
DROP POLICY IF EXISTS "Users can view their own growth plans" ON public.growth_plans;
DROP POLICY IF EXISTS "Users can insert their own growth plans" ON public.growth_plans;
DROP POLICY IF EXISTS "Users can update their own growth plans" ON public.growth_plans;
DROP POLICY IF EXISTS "Users can delete their own growth plans" ON public.growth_plans;

CREATE POLICY "Users can view their own growth plans" ON public.growth_plans
    FOR SELECT USING ((select auth.uid()) = profile_id);

CREATE POLICY "Users can insert their own growth plans" ON public.growth_plans
    FOR INSERT WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can update their own growth plans" ON public.growth_plans
    FOR UPDATE USING ((select auth.uid()) = profile_id)
    WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can delete their own growth plans" ON public.growth_plans
    FOR DELETE USING ((select auth.uid()) = profile_id);

-- Drop and recreate assignments policies
DROP POLICY IF EXISTS "Users can view assignments for their organizations" ON public.assignments;
DROP POLICY IF EXISTS "Organization members can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Organization admins can update assignments" ON public.assignments;

CREATE POLICY "Users can view assignments for their organizations" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = assignments.org_id
            AND om.user_id = (select auth.uid())
            AND om.status = 'active'
        )
    );

CREATE POLICY "Organization members can create assignments" ON public.assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = assignments.org_id
            AND om.user_id = (select auth.uid())
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can update assignments" ON public.assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = assignments.org_id
            AND om.user_id = (select auth.uid())
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );
