-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Individual profiles policies
CREATE POLICY "Users can view public or own individual profiles"
  ON public.individual_profiles FOR SELECT
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update own individual profile"
  ON public.individual_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own individual profile"
  ON public.individual_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_active_org_membership(target_org_id UUID, actor_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.org_id = target_org_id
      AND om.user_id = actor_id
      AND om.state = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(
  target_org_id UUID,
  allowed_roles TEXT[],
  actor_id UUID DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.org_id = target_org_id
      AND om.user_id = actor_id
      AND om.state = 'active'
      AND om.role = ANY (allowed_roles)
  );
$$;

DROP FUNCTION IF EXISTS public.normalize_org_role_compat(TEXT);

CREATE OR REPLACE FUNCTION public.is_trust_admin(actor_id UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = actor_id
      AND p.platform_role IN ('platform_admin', 'super_admin')
  );
$$;

-- Organizations policies
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners and managers can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org owners can update organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    public.has_active_org_membership(id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Org owners can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    public.has_org_role(id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

-- Organization members policies
DROP POLICY IF EXISTS "Members can view organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can delete members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and managers can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can insert members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can update members" ON public.organization_members;
DROP POLICY IF EXISTS "Org owners can delete members" ON public.organization_members;

CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    public.has_active_org_membership(org_id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
    -- Allow org creator to add first owner (themselves)
    OR (
      auth.uid() = user_id
      AND role = 'org_owner'
      AND EXISTS (
        SELECT 1 FROM public.organizations
        WHERE organizations.id = organization_members.org_id
          AND organizations.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Org owners can update members"
  ON public.organization_members FOR UPDATE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can delete members"
  ON public.organization_members FOR DELETE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

-- Organization invitations policies
DROP POLICY IF EXISTS "Org admins can view invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org admins can create invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org admins can delete invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org managers can view invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org managers can create invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org owners can create invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org owners can update invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Org owners can delete invitations" ON public.org_invitations;

CREATE POLICY "Org managers can view invitations"
  ON public.org_invitations FOR SELECT
  USING (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can create invitations"
  ON public.org_invitations FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can update invitations"
  ON public.org_invitations FOR UPDATE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org owners can delete invitations"
  ON public.org_invitations FOR DELETE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner'])
    OR public.is_trust_admin()
  );

-- Organization candidate invites policies (BYOC)
DO $$
BEGIN
  IF to_regclass('public.org_candidate_invites') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.org_candidate_invites ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Org members can view candidate invites" ON public.org_candidate_invites';
  EXECUTE 'DROP POLICY IF EXISTS "Org admins can create candidate invites" ON public.org_candidate_invites';
  EXECUTE 'DROP POLICY IF EXISTS "Org admins can update candidate invites" ON public.org_candidate_invites';
  EXECUTE 'DROP POLICY IF EXISTS "Org managers can create candidate invites" ON public.org_candidate_invites';
  EXECUTE 'DROP POLICY IF EXISTS "Org managers can update candidate invites" ON public.org_candidate_invites';

  EXECUTE '
    CREATE POLICY "Org members can view candidate invites"
    ON public.org_candidate_invites FOR SELECT
    USING (
      public.has_active_org_membership(org_id)
      OR public.is_trust_admin()
    )';

  EXECUTE '
    CREATE POLICY "Org managers can create candidate invites"
    ON public.org_candidate_invites FOR INSERT
    WITH CHECK (
      public.has_org_role(org_id, ARRAY[''org_owner'', ''org_manager''])
      OR public.is_trust_admin()
    )';

  EXECUTE '
    CREATE POLICY "Org managers can update candidate invites"
    ON public.org_candidate_invites FOR UPDATE
    USING (
      public.has_org_role(org_id, ARRAY[''org_owner'', ''org_manager''])
      OR public.is_trust_admin()
    )
    WITH CHECK (
      public.has_org_role(org_id, ARRAY[''org_owner'', ''org_manager''])
      OR public.is_trust_admin()
    )';
END $$;

-- Audit logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org owners and admins can view org audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org members can view org audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Org managers can view org audit logs" ON public.audit_logs;

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (actor_id = auth.uid());

CREATE POLICY "Org managers can view org audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    actor_id = auth.uid()
    OR (
      org_id IS NOT NULL
      AND public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    )
    OR public.is_trust_admin()
  );

CREATE POLICY "Service can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true); -- Server actions handle this

-- Feature flags policies (read-only for most users)
CREATE POLICY "Everyone can view feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Impact Stories policies
ALTER TABLE public.impact_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public impact stories"
  ON public.impact_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.individual_profiles
      WHERE individual_profiles.user_id = impact_stories.user_id
        AND (individual_profiles.visibility = 'public' OR individual_profiles.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own impact stories"
  ON public.impact_stories FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own impact stories"
  ON public.impact_stories FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own impact stories"
  ON public.impact_stories FOR DELETE
  USING (user_id = auth.uid());

-- Experiences policies
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public experiences"
  ON public.experiences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.individual_profiles
      WHERE individual_profiles.user_id = experiences.user_id
        AND (individual_profiles.visibility = 'public' OR individual_profiles.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own experiences"
  ON public.experiences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own experiences"
  ON public.experiences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own experiences"
  ON public.experiences FOR DELETE
  USING (user_id = auth.uid());

-- Education policies
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public education"
  ON public.education FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.individual_profiles
      WHERE individual_profiles.user_id = education.user_id
        AND (individual_profiles.visibility = 'public' OR individual_profiles.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own education"
  ON public.education FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own education"
  ON public.education FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own education"
  ON public.education FOR DELETE
  USING (user_id = auth.uid());

-- Volunteering policies
ALTER TABLE public.volunteering ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public volunteering"
  ON public.volunteering FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.individual_profiles
      WHERE individual_profiles.user_id = volunteering.user_id
        AND (individual_profiles.visibility = 'public' OR individual_profiles.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own volunteering"
  ON public.volunteering FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own volunteering"
  ON public.volunteering FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- MATCHING SYSTEM RLS POLICIES
-- ============================================================================

-- Matching Profiles
ALTER TABLE public.matching_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matching profile"
  ON public.matching_profiles FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own matching profile"
  ON public.matching_profiles FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own matching profile"
  ON public.matching_profiles FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills"
  ON public.skills FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own skills"
  ON public.skills FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own skills"
  ON public.skills FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own skills"
  ON public.skills FOR DELETE
  USING (profile_id = auth.uid());

-- Restrictive safeguard: matching profiles only visible to owner
CREATE POLICY "Matching profiles - owner only (restrictive)"
  ON public.matching_profiles
  AS RESTRICTIVE
  FOR SELECT
  USING (profile_id = auth.uid());

-- Assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view org assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org admins can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org admins can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org managers can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Org managers can update assignments" ON public.assignments;

CREATE POLICY "Org members can view org assignments"
  ON public.assignments FOR SELECT
  USING (
    public.has_active_org_membership(org_id)
    OR public.is_trust_admin()
  );

CREATE POLICY "Org managers can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

CREATE POLICY "Org managers can update assignments"
  ON public.assignments FOR UPDATE
  USING (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  )
  WITH CHECK (
    public.has_org_role(org_id, ARRAY['org_owner', 'org_manager'])
    OR public.is_trust_admin()
  );

-- Matches (blind matching results)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Org members can view assignment matches"
  ON public.matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      JOIN public.organization_members ON organization_members.org_id = assignments.org_id
      WHERE assignments.id = matches.assignment_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.state = 'active'
    )
  );

-- Match Interest
ALTER TABLE public.match_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interest signals"
  ON public.match_interest FOR SELECT
  USING (actor_profile_id = auth.uid() OR target_profile_id = auth.uid());

CREATE POLICY "Users can create interest signals"
  ON public.match_interest FOR INSERT
  WITH CHECK (actor_profile_id = auth.uid());

-- Rate Limits (service only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- EXPERTISE SYSTEM RLS POLICIES
-- ============================================================================

-- Capabilities
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own capabilities"
  ON public.capabilities FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can view public capabilities"
  ON public.capabilities FOR SELECT
  USING (privacy_level = 'public');

CREATE POLICY "Users can insert own capabilities"
  ON public.capabilities FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own capabilities"
  ON public.capabilities FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own capabilities"
  ON public.capabilities FOR DELETE
  USING (profile_id = auth.uid());

-- Evidence
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evidence"
  ON public.evidence FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can view evidence for public capabilities"
  ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.capabilities
      WHERE capabilities.id = evidence.capability_id
        AND capabilities.privacy_level = 'public'
    )
  );

CREATE POLICY "Users can insert own evidence"
  ON public.evidence FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own evidence"
  ON public.evidence FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own evidence"
  ON public.evidence FOR DELETE
  USING (profile_id = auth.uid());

-- Skill Endorsements
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view endorsements"
  ON public.skill_endorsements FOR SELECT
  USING (owner_profile_id = auth.uid());

CREATE POLICY "Endorser can view own endorsements"
  ON public.skill_endorsements FOR SELECT
  USING (endorser_profile_id = auth.uid());

CREATE POLICY "Users can create endorsements"
  ON public.skill_endorsements FOR INSERT
  WITH CHECK (endorser_profile_id = auth.uid());

CREATE POLICY "Owner can update endorsement status"
  ON public.skill_endorsements FOR UPDATE
  USING (owner_profile_id = auth.uid())
  WITH CHECK (owner_profile_id = auth.uid());

-- Growth Plans
ALTER TABLE public.growth_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own growth plans"
  ON public.growth_plans FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own growth plans"
  ON public.growth_plans FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own growth plans"
  ON public.growth_plans FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own growth plans"
  ON public.growth_plans FOR DELETE
  USING (profile_id = auth.uid());

-- ============================================================================
-- VERIFICATION REQUESTS (soft attestations)
-- ============================================================================
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Requester can view their own verification requests
CREATE POLICY "Verification requests - requester can select"
  ON public.verification_requests FOR SELECT
  USING (profile_id = auth.uid());

-- Requester can insert their own verification requests
CREATE POLICY "Verification requests - requester can insert"
  ON public.verification_requests FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Requester can update their own verification requests
CREATE POLICY "Verification requests - requester can update"
  ON public.verification_requests FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ============================================================================
-- IMPACT STORY VERIFICATION REQUESTS
-- ============================================================================
DO $$
BEGIN
  IF to_regclass('public.impact_story_verification_requests') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.impact_story_verification_requests ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'impact_story_verification_requests'
        AND policyname = 'Impact story verification requests - requester can select'
    ) THEN
      EXECUTE '
        CREATE POLICY "Impact story verification requests - requester can select"
        ON public.impact_story_verification_requests FOR SELECT
        USING (requester_profile_id = auth.uid())
      ';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'impact_story_verification_requests'
        AND policyname = 'Impact story verification requests - requester can insert'
    ) THEN
      EXECUTE '
        CREATE POLICY "Impact story verification requests - requester can insert"
        ON public.impact_story_verification_requests FOR INSERT
        WITH CHECK (requester_profile_id = auth.uid())
      ';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'impact_story_verification_requests'
        AND policyname = 'Impact story verification requests - requester can update'
    ) THEN
      EXECUTE '
        CREATE POLICY "Impact story verification requests - requester can update"
        ON public.impact_story_verification_requests FOR UPDATE
        USING (requester_profile_id = auth.uid())
        WITH CHECK (requester_profile_id = auth.uid())
      ';
    END IF;
  END IF;

  IF to_regclass('public.impact_story_verification_responses') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.impact_story_verification_responses ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'impact_story_verification_responses'
        AND policyname = 'Impact story verification responses - requester can select'
    ) THEN
      EXECUTE '
        CREATE POLICY "Impact story verification responses - requester can select"
        ON public.impact_story_verification_responses FOR SELECT
        USING (
          EXISTS (
            SELECT 1
            FROM public.impact_story_verification_requests req
            WHERE req.id = impact_story_verification_responses.request_id
              AND req.requester_profile_id = auth.uid()
          )
        )
      ';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- CONVERSATIONS & MESSAGES (private messaging)
-- ============================================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants can view their conversations
CREATE POLICY "Conversations - participants can select"
  ON public.conversations FOR SELECT
  USING (
    participant_one_id = auth.uid()
    OR participant_two_id = auth.uid()
  );

-- Participants can create conversations (if client-created)
CREATE POLICY "Conversations - participants can insert"
  ON public.conversations FOR INSERT
  WITH CHECK (
    participant_one_id = auth.uid()
    OR participant_two_id = auth.uid()
  );

-- Participants can send messages in conversations they belong to
CREATE POLICY "Messages - participants can insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.participant_one_id = auth.uid()
          OR c.participant_two_id = auth.uid()
        )
    )
  );

-- Participants can read messages in their conversations
CREATE POLICY "Messages - participants can select"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.participant_one_id = auth.uid()
          OR c.participant_two_id = auth.uid()
        )
    )
  );

-- Participants can update their own messages
CREATE POLICY "Messages - participants can update own"
  ON public.messages FOR UPDATE
  USING (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.participant_one_id = auth.uid()
          OR c.participant_two_id = auth.uid()
        )
    )
  )
  WITH CHECK (sender_id = auth.uid());

-- Participants can delete their own messages
CREATE POLICY "Messages - participants can delete own"
  ON public.messages FOR DELETE
  USING (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.participant_one_id = auth.uid()
          OR c.participant_two_id = auth.uid()
        )
    )
  );
