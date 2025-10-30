-- ============================================
-- RLS POLICY TEST SUITE
-- ============================================
-- Purpose: Verify Row-Level Security policies work correctly
-- Date: 2025-10-30
-- ============================================

-- ============================================
-- SETUP: VERIFICATION QUERIES
-- ============================================

-- Query 1: Verify RLS is enabled on all target tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'individual_profiles', 'organizations', 'organization_members', 'org_invitations',
    'matching_profiles', 'skills', 'assignments', 'matches', 'match_interest',
    'capabilities', 'evidence', 'skill_endorsements', 'growth_plans',
    'projects', 'project_skills', 'impact_stories', 'experiences', 'education', 'volunteering'
  )
ORDER BY tablename;

-- Expected: All 20 tables should have rowsecurity = true

-- ============================================

-- Query 2: Count policies per table
SELECT 
  schemaname, 
  tablename, 
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'individual_profiles', 'organizations', 'organization_members', 'org_invitations',
    'matching_profiles', 'skills', 'assignments', 'matches', 'match_interest',
    'capabilities', 'evidence', 'skill_endorsements', 'growth_plans',
    'projects', 'project_skills', 'impact_stories', 'experiences', 'education', 'volunteering'
  )
GROUP BY schemaname, tablename
ORDER BY policy_count DESC, tablename;

-- Expected: Each table should have 2-5 policies

-- ============================================

-- Query 3: List all policies by table (detailed view)
SELECT 
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING clause present'
    ELSE 'No USING clause'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK present'
    ELSE 'No WITH CHECK'
  END as has_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'individual_profiles', 'organizations', 'organization_members', 'org_invitations',
    'matching_profiles', 'skills', 'assignments', 'matches', 'match_interest',
    'capabilities', 'evidence', 'skill_endorsements', 'growth_plans',
    'projects', 'project_skills', 'impact_stories', 'experiences', 'education', 'volunteering'
  )
ORDER BY tablename, policyname;

-- ============================================
-- TEST SCENARIO 1: USER DATA ISOLATION
-- ============================================
-- Goal: Verify users can only see their own data
-- ============================================

-- Test 1.1: Profiles isolation
-- Expected: Users can only read their own profile
-- To test: Run as different authenticated users

-- As User A (auth.uid() = 'user-a-id'):
-- SELECT * FROM profiles WHERE id != auth.uid();
-- Expected result: 0 rows (cannot see other profiles)

-- As User A:
-- SELECT * FROM profiles WHERE id = auth.uid();
-- Expected result: 1 row (can see own profile)

-- ============================================

-- Test 1.2: Individual profiles isolation
-- Expected: Users can see own + public profiles

-- PUBLIC visibility test:
-- SELECT COUNT(*) FROM individual_profiles WHERE visibility = 'public';
-- Expected: All public profiles visible to authenticated users

-- PRIVATE visibility test:
-- SELECT COUNT(*) FROM individual_profiles 
-- WHERE visibility = 'private' AND user_id != auth.uid();
-- Expected: 0 rows (cannot see others' private profiles)

-- ============================================

-- Test 1.3: Matching profiles isolation (CRITICAL: compensation data)
-- Expected: Users only see own matching profile

-- SELECT * FROM matching_profiles WHERE profile_id != auth.uid();
-- Expected: 0 rows (unless user is org member viewing applicants)

-- SELECT * FROM matching_profiles WHERE profile_id = auth.uid();
-- Expected: 1 row (own matching profile)

-- ============================================
-- TEST SCENARIO 2: ORGANIZATION DATA ISOLATION
-- ============================================
-- Goal: Verify org members only see their org's data
-- ============================================

-- Test 2.1: Organization members isolation
-- Expected: Can only see members of orgs you belong to

-- SELECT COUNT(*) FROM organization_members 
-- WHERE org_id NOT IN (
--   SELECT org_id FROM organization_members WHERE user_id = auth.uid()
-- );
-- Expected: 0 rows (cannot see members of other orgs)

-- ============================================

-- Test 2.2: Assignments isolation (draft vs published)
-- Expected: Public can see active assignments, org members see all

-- As NON-member:
-- SELECT COUNT(*) FROM assignments WHERE status = 'draft';
-- Expected: 0 rows (cannot see draft assignments from other orgs)

-- SELECT COUNT(*) FROM assignments WHERE status = 'active';
-- Expected: N rows (can see all published assignments)

-- As ORG MEMBER:
-- SELECT COUNT(*) FROM assignments 
-- WHERE org_id IN (
--   SELECT org_id FROM organization_members WHERE user_id = auth.uid()
-- );
-- Expected: All assignments for user's org (including drafts)

-- ============================================

-- Test 2.3: Match interest isolation
-- Expected: Users see own interest, org members see interest in their assignments

-- As User:
-- SELECT COUNT(*) FROM match_interest 
-- WHERE actor_profile_id != auth.uid()
--   AND assignment_id NOT IN (
--     SELECT a.id FROM assignments a
--     JOIN organization_members om ON om.org_id = a.org_id
--     WHERE om.user_id = auth.uid()
--   );
-- Expected: 0 rows (cannot see others' interest unless you're org member)

-- ============================================
-- TEST SCENARIO 3: SKILL & EXPERTISE ISOLATION
-- ============================================

-- Test 3.1: Skills visibility (follows profile visibility)
-- Expected: Can see skills for public/network profiles only

-- SELECT COUNT(*) FROM skills s
-- WHERE NOT EXISTS (
--   SELECT 1 FROM individual_profiles ip
--   WHERE ip.user_id = s.profile_id
--     AND (ip.visibility = 'public' OR ip.user_id = auth.uid())
-- );
-- Expected: 0 rows (all visible skills should belong to public profiles or self)

-- ============================================

-- Test 3.2: Capabilities isolation
-- Expected: Only see own capabilities

-- SELECT COUNT(*) FROM capabilities WHERE profile_id != auth.uid();
-- Expected: 0 rows

-- ============================================

-- Test 3.3: Evidence isolation
-- Expected: Only see own evidence

-- SELECT COUNT(*) FROM evidence WHERE profile_id != auth.uid();
-- Expected: 0 rows

-- ============================================

-- Test 3.4: Skill endorsements
-- Expected: See endorsements you created or received

-- SELECT COUNT(*) FROM skill_endorsements 
-- WHERE endorser_profile_id != auth.uid()
--   AND owner_profile_id != auth.uid();
-- Expected: 0 rows (cannot see endorsements between other users)

-- ============================================
-- TEST SCENARIO 4: PROJECT & EXPERIENCE DATA
-- ============================================

-- Test 4.1: Projects visibility
-- Expected: See own projects + public/network projects

-- SELECT COUNT(*) FROM projects 
-- WHERE user_id != auth.uid()
--   AND visibility = 'private';
-- Expected: 0 rows (cannot see others' private projects)

-- ============================================

-- Test 4.2: Project skills isolation
-- Expected: Only manage skills for own projects

-- SELECT COUNT(*) FROM project_skills ps
-- WHERE NOT EXISTS (
--   SELECT 1 FROM projects p
--   WHERE p.id = ps.project_id AND p.user_id = auth.uid()
-- );
-- Expected: 0 rows (can only see project skills for own projects)

-- ============================================

-- Test 4.3: Impact stories, experiences, education, volunteering
-- Expected: Only see own records

-- SELECT COUNT(*) FROM impact_stories WHERE user_id != auth.uid();
-- Expected: 0 rows

-- SELECT COUNT(*) FROM experiences WHERE user_id != auth.uid();
-- Expected: 0 rows

-- SELECT COUNT(*) FROM education WHERE user_id != auth.uid();
-- Expected: 0 rows

-- SELECT COUNT(*) FROM volunteering WHERE user_id != auth.uid();
-- Expected: 0 rows

-- ============================================
-- TEST SCENARIO 5: WRITE OPERATIONS
-- ============================================

-- Test 5.1: Users can only insert their own data
-- Test by attempting to insert with wrong user_id:

-- INSERT INTO profiles (id, handle, display_name)
-- VALUES ('different-user-id', 'test', 'Test User');
-- Expected: POLICY VIOLATION (WITH CHECK failed)

-- ============================================

-- Test 5.2: Users can only update their own data
-- Test by attempting to update another user's profile:

-- UPDATE profiles SET display_name = 'Hacked' 
-- WHERE id != auth.uid();
-- Expected: 0 rows updated (USING clause blocks access)

-- ============================================

-- Test 5.3: Org members can manage their org's data
-- As NON-member, try to create assignment for org:

-- INSERT INTO assignments (org_id, role, description, status)
-- VALUES ('some-org-id', 'Test Role', 'Test', 'draft');
-- Expected: POLICY VIOLATION (not a member of that org)

-- ============================================
-- SECURITY AUDIT: CRITICAL CHECKS
-- ============================================

-- Check 1: Ensure NO tables have permissive policies
SELECT 
  tablename,
  policyname,
  'WARNING: Permissive policy detected' as alert
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = true
  AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename, policyname;

-- Expected: Only system-controlled tables (matches, conversations) should have permissive INSERT

-- ============================================

-- Check 2: Ensure all user-data tables have USING clauses
SELECT 
  tablename,
  COUNT(*) as policies_without_using
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'SELECT'
  AND qual IS NULL
  AND tablename NOT IN ('organizations') -- Public tables excluded
GROUP BY tablename;

-- Expected: 0 rows (all SELECT policies should have USING clauses)

-- ============================================

-- Check 3: Verify auth.uid() is used in critical tables
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'matching_profiles', 'individual_profiles')
  AND cmd = 'SELECT'
  AND qual NOT LIKE '%auth.uid()%';

-- Expected: 0 rows (all critical tables should check auth.uid())

-- ============================================
-- PRACTICAL TEST QUERIES
-- ============================================
-- Run these as authenticated user to verify isolation
-- ============================================

-- Test: Read own profile (should work)
SELECT * FROM profiles WHERE id = auth.uid();

-- Test: Read other profiles (should fail)
SELECT * FROM profiles WHERE id != auth.uid() LIMIT 1;

-- Test: Read own matching profile (should work)
SELECT * FROM matching_profiles WHERE profile_id = auth.uid();

-- Test: Read other matching profiles (should fail unless org member)
SELECT * FROM matching_profiles WHERE profile_id != auth.uid() LIMIT 1;

-- Test: Read public organizations (should work)
SELECT * FROM organizations LIMIT 5;

-- Test: Read published assignments (should work)
SELECT * FROM assignments WHERE status = 'active' LIMIT 5;

-- Test: Read draft assignments from orgs you're not in (should fail)
SELECT * FROM assignments 
WHERE status = 'draft' 
  AND org_id NOT IN (
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
  ) 
LIMIT 1;

-- ============================================
-- SUMMARY QUERY
-- ============================================

SELECT 
  'RLS Deployment Status' as metric,
  COUNT(DISTINCT tablename) as table_count,
  COUNT(*) as total_policies,
  ROUND(AVG(policy_count), 2) as avg_policies_per_table
FROM (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'profiles', 'individual_profiles', 'organizations', 'organization_members', 'org_invitations',
      'matching_profiles', 'skills', 'assignments', 'matches', 'match_interest',
      'capabilities', 'evidence', 'skill_endorsements', 'growth_plans',
      'projects', 'project_skills', 'impact_stories', 'experiences', 'education', 'volunteering'
    )
  GROUP BY tablename
) policy_counts;

-- Expected: 20 tables, ~50-60 total policies, 2.5-3 avg policies per table

-- ============================================
-- END OF TEST SUITE
-- ============================================

