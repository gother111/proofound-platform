-- ============================================================================
-- GENERATED FROM REMOTE supabase_migrations.schema_migrations
-- version: 20251025221705
-- name: add_missing_rls_policies
--
-- This file exists to sync local migration history with the remote database.
-- Do not edit by hand. Source of truth is the remote DB migration table.
-- ============================================================================
-- Add RLS policies for education table
CREATE POLICY "Users can view their own education" ON public.education
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own education" ON public.education
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own education" ON public.education
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own education" ON public.education
    FOR DELETE USING (user_id = auth.uid());

-- Add RLS policies for experiences table
CREATE POLICY "Users can view their own experiences" ON public.experiences
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own experiences" ON public.experiences
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own experiences" ON public.experiences
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own experiences" ON public.experiences
    FOR DELETE USING (user_id = auth.uid());

-- Add RLS policies for impact_stories table
CREATE POLICY "Users can view their own impact stories" ON public.impact_stories
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own impact stories" ON public.impact_stories
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own impact stories" ON public.impact_stories
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own impact stories" ON public.impact_stories
    FOR DELETE USING (user_id = auth.uid());

-- Add RLS policies for skills table
CREATE POLICY "Users can view their own skills" ON public.skills
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own skills" ON public.skills
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own skills" ON public.skills
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own skills" ON public.skills
    FOR DELETE USING (profile_id = auth.uid());

-- Add RLS policies for volunteering table
CREATE POLICY "Users can view their own volunteering" ON public.volunteering
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own volunteering" ON public.volunteering
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own volunteering" ON public.volunteering
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own volunteering" ON public.volunteering
    FOR DELETE USING (user_id = auth.uid());

-- Add RLS policies for rate_limits table (system table)
CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL USING (true);
