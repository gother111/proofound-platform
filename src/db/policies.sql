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

-- Organizations policies
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners and admins can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.status = 'active'
    )
  );

-- Organization members policies
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

CREATE POLICY "Owners and admins can insert members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
    )
    OR auth.uid() = user_id -- Allow self-join via invitation
  );

CREATE POLICY "Owners and admins can update members"
  ON public.organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
    )
  );

CREATE POLICY "Owners and admins can delete members"
  ON public.organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members AS om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
    )
  );

-- Organization invitations policies
CREATE POLICY "Org admins can view invitations"
  ON public.org_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = org_invitations.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.status = 'active'
    )
  );

CREATE POLICY "Org admins can create invitations"
  ON public.org_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = org_invitations.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.status = 'active'
    )
  );

CREATE POLICY "Org admins can delete invitations"
  ON public.org_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = org_invitations.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.status = 'active'
    )
  );

-- Audit logs policies
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (actor_id = auth.uid());

CREATE POLICY "Org members can view org audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = audit_logs.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.status = 'active'
    )
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

-- Assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view org assignments"
  ON public.assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = assignments.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.status = 'active'
    )
  );

CREATE POLICY "Org admins can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = assignments.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.status = 'active'
    )
  );

CREATE POLICY "Org admins can update assignments"
  ON public.assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.org_id = assignments.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
        AND organization_members.status = 'active'
    )
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
        AND organization_members.status = 'active'
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

