-- Continue optimizing RLS policies for performance (Part 2)

-- Drop and recreate org_invitations policies
DROP POLICY IF EXISTS "Org admins can view invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org admins can create invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org admins can delete invitations" ON public.org_invitations;

CREATE POLICY "Org admins can view invitations" ON public.org_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = org_invitations.org_id
            AND om.user_id = (select auth.uid())
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

CREATE POLICY "Org admins can create invitations" ON public.org_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = org_invitations.org_id
            AND om.user_id = (select auth.uid())
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

CREATE POLICY "Org admins can delete invitations" ON public.org_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = org_invitations.org_id
            AND om.user_id = (select auth.uid())
            AND om.role IN ('owner', 'admin')
            AND om.status = 'active'
        )
    );

-- Drop and recreate audit_logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org members can view org audit logs" ON public.audit_logs;

CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING ((select auth.uid()) = actor_id);

CREATE POLICY "Org members can view org audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.org_id = audit_logs.org_id
            AND om.user_id = (select auth.uid())
            AND om.status = 'active'
        )
    );

-- Drop and recreate capabilities policies
DROP POLICY IF EXISTS "Users can view their own capabilities" ON public.capabilities;
DROP POLICY IF EXISTS "Users can insert their own capabilities" ON public.capabilities;
DROP POLICY IF EXISTS "Users can update their own capabilities" ON public.capabilities;
DROP POLICY IF EXISTS "Users can delete their own capabilities" ON public.capabilities;

CREATE POLICY "Users can view their own capabilities" ON public.capabilities
    FOR SELECT USING ((select auth.uid()) = profile_id);

CREATE POLICY "Users can insert their own capabilities" ON public.capabilities
    FOR INSERT WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can update their own capabilities" ON public.capabilities
    FOR UPDATE USING ((select auth.uid()) = profile_id)
    WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can delete their own capabilities" ON public.capabilities
    FOR DELETE USING ((select auth.uid()) = profile_id);

-- Drop and recreate evidence policies
DROP POLICY IF EXISTS "Users can view their own evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users can insert their own evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users can update their own evidence" ON public.evidence;
DROP POLICY IF EXISTS "Users can delete their own evidence" ON public.evidence;

CREATE POLICY "Users can view their own evidence" ON public.evidence
    FOR SELECT USING ((select auth.uid()) = profile_id);

CREATE POLICY "Users can insert their own evidence" ON public.evidence
    FOR INSERT WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can update their own evidence" ON public.evidence
    FOR UPDATE USING ((select auth.uid()) = profile_id)
    WITH CHECK ((select auth.uid()) = profile_id);

CREATE POLICY "Users can delete their own evidence" ON public.evidence
    FOR DELETE USING ((select auth.uid()) = profile_id);
