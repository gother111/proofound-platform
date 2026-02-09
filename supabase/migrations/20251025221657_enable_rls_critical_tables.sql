-- Enable RLS on critical tables that are missing it
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_profiles ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for assignments table
CREATE POLICY "Users can view assignments for their organizations" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = assignments.org_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
        )
    );

CREATE POLICY "Organization members can create assignments" ON public.assignments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = assignments.org_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Organization admins can update assignments" ON public.assignments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = assignments.org_id
            AND om.user_id = auth.uid()
            AND om.status = 'active'
            AND om.role IN ('owner', 'admin')
        )
    );

-- Add basic RLS policies for matches table
CREATE POLICY "Users can view their own matches" ON public.matches
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "System can create matches" ON public.matches
    FOR INSERT WITH CHECK (true);

-- Add basic RLS policies for match_interest table
CREATE POLICY "Users can view their own match interests" ON public.match_interest
    FOR SELECT USING (actor_profile_id = auth.uid());

CREATE POLICY "Users can create match interests" ON public.match_interest
    FOR INSERT WITH CHECK (actor_profile_id = auth.uid());

-- Add basic RLS policies for matching_profiles table
CREATE POLICY "Users can view their own matching profile" ON public.matching_profiles
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Users can update their own matching profile" ON public.matching_profiles
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Users can insert their own matching profile" ON public.matching_profiles
    FOR INSERT WITH CHECK (profile_id = auth.uid());
