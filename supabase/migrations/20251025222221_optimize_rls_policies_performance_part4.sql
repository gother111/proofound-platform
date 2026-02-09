-- Continue optimizing RLS policies for performance (Part 4)

-- Drop and recreate matches policies
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
DROP POLICY IF EXISTS "System can create matches" ON public.matches;

CREATE POLICY "Users can view their own matches" ON public.matches
    FOR SELECT USING ((select auth.uid()) = profile_id);

CREATE POLICY "System can create matches" ON public.matches
    FOR INSERT WITH CHECK (true);

-- Drop and recreate match_interest policies
DROP POLICY IF EXISTS "Users can view their own match interests" ON public.match_interest;
DROP POLICY IF EXISTS "Users can create match interests" ON public.match_interest;

CREATE POLICY "Users can view their own match interests" ON public.match_interest
    FOR SELECT USING ((select auth.uid()) = actor_profile_id);

CREATE POLICY "Users can create match interests" ON public.match_interest
    FOR INSERT WITH CHECK ((select auth.uid()) = actor_profile_id);

-- Drop and recreate matching_profiles policies
DROP POLICY IF EXISTS "Users can view their own matching profile" ON public.matching_profiles;
DROP POLICY IF EXISTS "Users can update their own matching profile" ON public.matching_profiles;
DROP POLICY IF EXISTS "Users can insert their own matching profile" ON public.matching_profiles;

CREATE POLICY "Users can view their own matching profile" ON public.matching_profiles
    FOR SELECT USING ((select auth.uid()) = profile_id);

CREATE POLICY "Users can update their own matching profile" ON public.matching_profiles
    FOR UPDATE USING ((select auth.uid()) = profile_id);

CREATE POLICY "Users can insert their own matching profile" ON public.matching_profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = profile_id);

-- Drop and recreate education policies
DROP POLICY IF EXISTS "Users can view their own education" ON public.education;
DROP POLICY IF EXISTS "Users can insert their own education" ON public.education;
DROP POLICY IF EXISTS "Users can update their own education" ON public.education;
DROP POLICY IF EXISTS "Users can delete their own education" ON public.education;

CREATE POLICY "Users can view their own education" ON public.education
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own education" ON public.education
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own education" ON public.education
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own education" ON public.education
    FOR DELETE USING ((select auth.uid()) = user_id);

-- Drop and recreate experiences policies
DROP POLICY IF EXISTS "Users can view their own experiences" ON public.experiences;
DROP POLICY IF EXISTS "Users can insert their own experiences" ON public.experiences;
DROP POLICY IF EXISTS "Users can update their own experiences" ON public.experiences;
DROP POLICY IF EXISTS "Users can delete their own experiences" ON public.experiences;

CREATE POLICY "Users can view their own experiences" ON public.experiences
    FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own experiences" ON public.experiences
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own experiences" ON public.experiences
    FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own experiences" ON public.experiences
    FOR DELETE USING ((select auth.uid()) = user_id);
