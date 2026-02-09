-- Phase 3: Add Missing Foreign Key Indexes
-- Add indexes for all foreign keys to improve JOIN performance

-- assignments table
CREATE INDEX IF NOT EXISTS idx_assignments_org_id ON public.assignments(org_id);

-- capabilities table
CREATE INDEX IF NOT EXISTS idx_capabilities_skill_record_id ON public.capabilities(skill_record_id);
CREATE INDEX IF NOT EXISTS idx_capabilities_profile_id ON public.capabilities(profile_id);

-- education table
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);

-- evidence table
CREATE INDEX IF NOT EXISTS idx_evidence_capability_id ON public.evidence(capability_id);
CREATE INDEX IF NOT EXISTS idx_evidence_profile_id ON public.evidence(profile_id);

-- experiences table
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON public.experiences(user_id);

-- growth_plans table
CREATE INDEX IF NOT EXISTS idx_growth_plans_capability_id ON public.growth_plans(capability_id);
CREATE INDEX IF NOT EXISTS idx_growth_plans_profile_id ON public.growth_plans(profile_id);

-- impact_stories table
CREATE INDEX IF NOT EXISTS idx_impact_stories_user_id ON public.impact_stories(user_id);

-- match_interest table
CREATE INDEX IF NOT EXISTS idx_match_interest_target_profile_id ON public.match_interest(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_match_interest_actor_profile_id ON public.match_interest(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_match_interest_assignment_id ON public.match_interest(assignment_id);

-- org_invitations table
CREATE INDEX IF NOT EXISTS idx_org_invitations_invited_by ON public.org_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org_id ON public.org_invitations(org_id);

-- organization_members table
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members(user_id);

-- organizations table
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations(created_by);

-- skill_endorsements table
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorser_profile_id ON public.skill_endorsements(endorser_profile_id);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_owner_profile_id ON public.skill_endorsements(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_capability_id ON public.skill_endorsements(capability_id);

-- skills table
CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON public.skills(profile_id);

-- volunteering table
CREATE INDEX IF NOT EXISTS idx_volunteering_user_id ON public.volunteering(user_id);
