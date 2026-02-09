-- Continue optimizing RLS policies for performance (Part 5 - Final)

-- Drop and recreate impact_stories policies
DROP POLICY IF EXISTS "Users can view their own impact stories" ON public.impact_stories;
DROP POLICY IF EXISTS "Users can insert their own impact stories" ON public.impact_stories;
DROP POLICY IF EXISTS "Users can update their own impact stories" ON public.impact_stories;
DROP POLICY IF EXISTS "Users can delete their own impact stories" ON public.impact_stories;

CREATE POLICY "Users can view their own impact stories" ON public.impact_stories
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own impact stories" ON public.impact_stories
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own impact stories" ON public.impact_stories
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own impact stories" ON public.impact_stories
    FOR DELETE USING ((select auth.uid()) = user_id);

-- Drop and recreate skills policies
DROP POLICY IF EXISTS "Users can view their own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can insert their own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can update their own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can delete their own skills" ON public.skills;

CREATE POLICY "Users can view their own skills" ON public.skills
    FOR SELECT USING ((select auth.uid()) = profile_id);

CREATE POLICY "Users can insert their own skills" ON public.skills
    FOR INSERT WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can update their own skills" ON public.skills
    FOR UPDATE USING ((select auth.uid()) = profile_id);

CREATE POLICY "Users can delete their own skills" ON public.skills
    FOR DELETE USING ((select auth.uid()) = profile_id);

-- Drop and recreate volunteering policies
DROP POLICY IF EXISTS "Users can view their own volunteering" ON public.volunteering;
DROP POLICY IF EXISTS "Users can insert their own volunteering" ON public.volunteering;
DROP POLICY IF EXISTS "Users can update their own volunteering" ON public.volunteering;
DROP POLICY IF EXISTS "Users can delete their own volunteering" ON public.volunteering;

CREATE POLICY "Users can view their own volunteering" ON public.volunteering
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own volunteering" ON public.volunteering
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own volunteering" ON public.volunteering
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own volunteering" ON public.volunteering
    FOR DELETE USING ((select auth.uid()) = user_id);

-- Drop and recreate rate_limits policy
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;

CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL USING (true);
