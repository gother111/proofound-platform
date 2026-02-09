-- Phase 1: Optimize RLS Policies for Performance
-- Replace auth.uid() with (select auth.uid()) in all policies for better performance

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Drop and recreate individual_profiles policies
DROP POLICY IF EXISTS "Users can view public or own individual profiles" ON public.individual_profiles;
DROP POLICY IF EXISTS "Users can update own individual profile" ON public.individual_profiles;
DROP POLICY IF EXISTS "Users can insert own individual profile" ON public.individual_profiles;

CREATE POLICY "Users can view public or own individual profiles" ON public.individual_profiles
    FOR SELECT USING (
        visibility = 'public' OR (select auth.uid()) = user_id
    );

CREATE POLICY "Users can update own individual profile" ON public.individual_profiles
    FOR UPDATE USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own individual profile" ON public.individual_profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Drop and recreate organizations policies
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations" ON public.organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.org_id = organizations.id
            AND organization_members.user_id = (select auth.uid())
            AND organization_members.status = 'active'
        )
    );

CREATE POLICY "Authenticated users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Owners and admins can update organizations" ON public.organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.org_id = organizations.id
            AND organization_members.user_id = (select auth.uid())
            AND organization_members.role IN ('owner', 'admin')
            AND organization_members.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.org_id = organizations.id
            AND organization_members.user_id = (select auth.uid())
            AND organization_members.role IN ('owner', 'admin')
            AND organization_members.status = 'active'
        )
    );

-- Drop and recreate organization_members policies
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON public.organization_members;

CREATE POLICY "Members can view organization members" ON public.organization_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = organization_members.org_id
            AND om.user_id = (select auth.uid())
            AND om.status = 'active'
        )
    );

CREATE POLICY "Owners and admins can insert members" ON public.organization_members
    FOR INSERT WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM organization_members om
                WHERE om.org_id = organization_members.org_id
                AND om.user_id = (select auth.uid())
                AND om.role IN ('owner', 'admin')
                AND om.status = 'active'
            )
        ) OR ((select auth.uid()) = user_id)
    );

CREATE POLICY "Owners and admins can update members" ON public.organization_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = organization_members.org_id
            AND om.user_id = (select auth.uid())
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

CREATE POLICY "Owners and admins can delete members" ON public.organization_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = organization_members.org_id
            AND om.user_id = (select auth.uid())
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );
