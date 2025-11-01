-- ============================================
-- PROOFOUND RLS POLICIES DEPLOYMENT (REVISED)
-- ============================================
-- Migration: 001_enable_rls_policies
-- Date: 2025-10-30
-- Purpose: Deploy Row-Level Security policies for existing tables
-- Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 6.2
-- Audit: CROSS_DOCUMENT_PRIVACY_AUDIT.md Section 5
-- ============================================
-- Note: Only includes policies for tables that exist in current schema
-- ============================================

-- ============================================
-- SECTION 1: ENABLE RLS ON ALL EXISTING TABLES
-- ============================================

-- Core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

-- Matching system
ALTER TABLE matching_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_interest ENABLE ROW LEVEL SECURITY;

-- Expertise system
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_plans ENABLE ROW LEVEL SECURITY;

-- Projects & experience
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteering ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECTION 2: TIER 1 (PII) - HIGHEST PROTECTION
-- ============================================

-- ========================
-- PROFILES (Tier 1: PII)
-- ========================

-- Policy 1: Users can read their own profile
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile (during signup)
CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- SECTION 3: TIER 2 (SENSITIVE) - HIGH PROTECTION
-- ============================================

-- ========================
-- MATCHING PROFILES (Tier 2: Sensitive - Compensation data)
-- ========================

-- Policy 1: Users can read their own matching profile
CREATE POLICY "users_read_own_matching_profile"
  ON matching_profiles FOR SELECT
  USING (profile_id = auth.uid());

-- Policy 2: Users can update their own matching profile
CREATE POLICY "users_update_own_matching_profile"
  ON matching_profiles FOR UPDATE
  USING (profile_id = auth.uid());

-- Policy 3: Users can insert their own matching profile
CREATE POLICY "users_insert_own_matching_profile"
  ON matching_profiles FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Policy 4: Organizations can see matching profiles of users who applied
CREATE POLICY "orgs_read_applicant_matching_profiles"
  ON matching_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.profile_id = matching_profiles.profile_id
        AND m.assignment_id IN (
          SELECT a.id FROM assignments a
          JOIN organization_members om ON om.org_id = a.org_id
          WHERE om.user_id = auth.uid()
        )
    )
  );

-- ============================================
-- SECTION 4: TIER 3 (SEMI-PUBLIC) - USER-CONTROLLED
-- ============================================

-- ========================
-- INDIVIDUAL PROFILES (Tier 3: Visibility-based)
-- ========================

-- Policy 1: Users can read their own profile
CREATE POLICY "users_read_own_individual_profile"
  ON individual_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Public profiles visible to all authenticated users
CREATE POLICY "public_individual_profiles_readable"
  ON individual_profiles FOR SELECT
  USING (
    visibility = 'public'
    AND auth.role() = 'authenticated'
  );

-- Policy 3: Network profiles visible to matched users
CREATE POLICY "network_individual_profiles_readable"
  ON individual_profiles FOR SELECT
  USING (
    visibility = 'network'
    AND EXISTS (
      SELECT 1 FROM match_interest mi
      WHERE (mi.actor_profile_id = auth.uid() AND mi.target_profile_id = user_id)
         OR (mi.target_profile_id = auth.uid() AND mi.actor_profile_id = user_id)
    )
  );

-- Policy 4: Users can update their own profile
CREATE POLICY "users_update_own_individual_profile"
  ON individual_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Policy 5: Users can insert their own profile
CREATE POLICY "users_insert_own_individual_profile"
  ON individual_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ========================
-- SKILLS (Tier 3: User-controlled)
-- ========================

-- Policy 1: Users can read their own skills
CREATE POLICY "users_read_own_skills"
  ON skills FOR SELECT
  USING (profile_id = auth.uid());

-- Policy 2: Users can view skills of profiles they can see
CREATE POLICY "users_read_visible_profile_skills"
  ON skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM individual_profiles
      WHERE individual_profiles.user_id = skills.profile_id
        AND (
          individual_profiles.visibility = 'public'
          OR (
            individual_profiles.visibility = 'network'
            AND EXISTS (
              SELECT 1 FROM match_interest
              WHERE (actor_profile_id = auth.uid() AND target_profile_id = skills.profile_id)
                 OR (target_profile_id = auth.uid() AND actor_profile_id = skills.profile_id)
            )
          )
          OR individual_profiles.user_id = auth.uid()
        )
    )
  );

-- Policy 3: Users can manage their own skills
CREATE POLICY "users_insert_own_skills"
  ON skills FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "users_update_own_skills"
  ON skills FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "users_delete_own_skills"
  ON skills FOR DELETE
  USING (profile_id = auth.uid());

-- ========================
-- CAPABILITIES (Tier 3: Expertise system)
-- ========================

CREATE POLICY "users_read_own_capabilities"
  ON capabilities FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "users_insert_own_capabilities"
  ON capabilities FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "users_update_own_capabilities"
  ON capabilities FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "users_delete_own_capabilities"
  ON capabilities FOR DELETE
  USING (profile_id = auth.uid());

-- ========================
-- EVIDENCE (Tier 3: Proof system)
-- ========================

CREATE POLICY "users_read_own_evidence"
  ON evidence FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "users_insert_own_evidence"
  ON evidence FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "users_update_own_evidence"
  ON evidence FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "users_delete_own_evidence"
  ON evidence FOR DELETE
  USING (profile_id = auth.uid());

-- ========================
-- PROJECTS (Tier 3: User-controlled visibility)
-- ========================

CREATE POLICY "users_read_own_projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_projects"
  ON projects FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_projects"
  ON projects FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "users_read_visible_projects"
  ON projects FOR SELECT
  USING (
    visibility = 'public'
    OR (
      visibility = 'network'
      AND EXISTS (
        SELECT 1 FROM match_interest
        WHERE (actor_profile_id = auth.uid() AND target_profile_id = projects.user_id)
           OR (target_profile_id = auth.uid() AND actor_profile_id = projects.user_id)
      )
    )
  );

-- ========================
-- PROJECT SKILLS (Tier 3: Linked to projects)
-- ========================

CREATE POLICY "users_manage_own_project_skills"
  ON project_skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_skills.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- ========================
-- IMPACT STORIES, EXPERIENCES, EDUCATION, VOLUNTEERING
-- ========================

CREATE POLICY "users_manage_own_impact_stories"
  ON impact_stories FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "users_manage_own_experiences"
  ON experiences FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "users_manage_own_education"
  ON education FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "users_manage_own_volunteering"
  ON volunteering FOR ALL
  USING (user_id = auth.uid());

-- ========================
-- SKILL ENDORSEMENTS (Tier 3: Peer validation)
-- ========================

CREATE POLICY "users_create_endorsements"
  ON skill_endorsements FOR INSERT
  WITH CHECK (endorser_profile_id = auth.uid());

CREATE POLICY "owners_read_endorsements"
  ON skill_endorsements FOR SELECT
  USING (owner_profile_id = auth.uid());

CREATE POLICY "endorsers_read_own_endorsements"
  ON skill_endorsements FOR SELECT
  USING (endorser_profile_id = auth.uid());

CREATE POLICY "owners_respond_to_endorsements"
  ON skill_endorsements FOR UPDATE
  USING (owner_profile_id = auth.uid());

-- ========================
-- GROWTH PLANS (Tier 3: Personal development)
-- ========================

CREATE POLICY "users_manage_own_growth_plans"
  ON growth_plans FOR ALL
  USING (profile_id = auth.uid());

-- ============================================
-- SECTION 5: TIER 4 (PUBLIC) - ORGANIZATION DATA
-- ============================================

-- ========================
-- ORGANIZATIONS (Tier 4: Public)
-- ========================

CREATE POLICY "authenticated_read_organizations"
  ON organizations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "org_members_update_organizations"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "users_create_organizations"
  ON organizations FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- ========================
-- ORGANIZATION MEMBERS (Tier 2: Org isolation)
-- ========================

CREATE POLICY "org_members_read_members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_manage_members"
  ON organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = organization_members.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ========================
-- ORG INVITATIONS (Tier 2: Org isolation)
-- ========================

CREATE POLICY "org_members_read_invitations"
  ON org_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = org_invitations.org_id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_create_invitations"
  ON org_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = org_invitations.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
    AND invited_by = auth.uid()
  );

-- ========================
-- ASSIGNMENTS (Tier 4: Public when published)
-- ========================

CREATE POLICY "authenticated_read_published_assignments"
  ON assignments FOR SELECT
  USING (
    status = 'active'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "org_members_read_org_assignments"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = assignments.org_id
        AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_create_assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = assignments.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "org_members_update_assignments"
  ON assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = assignments.org_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin', 'member')
    )
  );

-- ========================
-- MATCHES (Tier 3: Match privacy)
-- ========================

CREATE POLICY "users_read_own_matches"
  ON matches FOR SELECT
  USING (
    profile_id = auth.uid()
    OR assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN organization_members om ON om.org_id = a.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Policy: Only service role can create matches (backend matching algorithm only)
CREATE POLICY "system_creates_matches"
  ON matches FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- ========================
-- MATCH INTEREST (Tier 3: User actions)
-- ========================

CREATE POLICY "users_read_own_match_interest"
  ON match_interest FOR SELECT
  USING (actor_profile_id = auth.uid());

CREATE POLICY "org_members_read_assignment_interest"
  ON match_interest FOR SELECT
  USING (
    assignment_id IN (
      SELECT a.id FROM assignments a
      JOIN organization_members om ON om.org_id = a.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "users_create_match_interest"
  ON match_interest FOR INSERT
  WITH CHECK (actor_profile_id = auth.uid());

-- ============================================
-- VERIFICATION: CHECK RLS STATUS
-- ============================================

-- Run this query after migration to verify all tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'profiles', 'individual_profiles', 'organizations', 'organization_members', 'org_invitations',
--     'matching_profiles', 'skills', 'assignments', 'matches', 'match_interest',
--     'capabilities', 'evidence', 'skill_endorsements', 'growth_plans',
--     'projects', 'project_skills', 'impact_stories', 'experiences', 'education', 'volunteering'
--   )
-- ORDER BY tablename;

-- Expected: 20 rows with rowsecurity = true

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Run test queries (see test_rls_policies.sql)
-- 2. Verify all critical scenarios pass
-- 3. Update CROSS_DOCUMENT_PRIVACY_AUDIT.md
-- ============================================
