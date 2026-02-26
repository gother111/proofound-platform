> Doc Class: `historical`
> Historical Snapshot Reviewed: `2026-02-26`
> Canonical Current Testing Docs:
>
> - `docs/testing-strategy.md`
> - `docs/qa/e2e-matrix.md`
> - `docs/qa/summary.md`
> - `agent/checklists/verification.md`
> - `agent/runbooks/setup.md`
>
> Note: This archived file preserves historical context. For current routes, commands, and gate criteria, use the canonical docs above.

---

# Comprehensive PRD Flow Testing Report

**Date:** 2025-01-27  
**Tester:** Automated + Manual Testing  
**Status:** In Progress

---

## Phase 1: Database Connectivity Verification ✅

### 1.1 Database Connection Test

**Status:** ✅ PASSED

- **Supabase Connection:** Active and verified
- **Database Tables:** All required tables exist (67 tables total)
- **Data Counts:**
  - Profiles: 20
  - Organizations: 4
  - Assignments: 6
  - Matches: (to be verified)
  - Skills: (to be verified)

### 1.2 Database Schema Verification

**Status:** ✅ PASSED

**Database Data Summary (Verified via Supabase MCP):**

- Profiles: 20
- Organizations: 4 (GreenPath NGO, SkillBridge, CircularCraft, Circular Craft)
- Assignments: 6 (all with status 'active' and creation_status 'published')
- Skills: 42
- Matching Profiles: 5
- Experiences: 21
- Education: 12
- Volunteering: 15
- Organization Members: 6 active members
- Matches: 0 (to be generated)
- Wellbeing Checkins: 0
- Interviews: 0
- Decisions: 0

**Sample Data Verified:**

- **Organizations:**
  - GreenPath NGO: 2 active members, 2 assignments
  - SkillBridge: 2 active members, 2 assignments
  - CircularCraft: 1 active member, 2 assignments
  - Circular Craft: 1 active member, 0 assignments

- **Assignments:**
  - "Data Analyst for Social Impact Metrics" (CircularCraft)
  - "Supply Chain Consultant with Fair Trade Experience" (CircularCraft)
  - "Full-Stack Engineer (EdTech Platform)" (SkillBridge)
  - "UX Designer for Mobile Learning App" (SkillBridge)
  - "Impact Measurement Analyst" (GreenPath NGO)

- **Skills:**
  - Sample skills found: UI/UX Design, User Research, Figma, Product Strategy, Design Systems, Prototyping, Data Visualization, Sustainability Design, TypeScript, React
  - Skills have proper levels (3-5) and months_experience values
  - All skills linked to valid profile_ids

**Verified Tables:**

- ✅ `profiles` - Individual user profiles
- ✅ `organizations` - Organization profiles
- ✅ `assignments` - Job assignments
- ✅ `matches` - Matching results
- ✅ `skills` - User skills (L4 level)
- ✅ `matching_profiles` - Matching configuration
- ✅ `experiences` - Work experience
- ✅ `education` - Education records
- ✅ `volunteering` - Volunteering experience
- ✅ `wellbeing_checkins` - Zen Hub check-ins
- ✅ `interviews` - Interview records
- ✅ `decisions` - Hiring decisions
- ✅ `organization_members` - Team members
- ✅ `skills_taxonomy` - L1→L4 taxonomy
- ✅ `skills_categories` - L1 categories
- ✅ `skills_subcategories` - L2 subcategories
- ✅ `skills_l3` - L3 categories
- ✅ `contracts` - Signed contracts
- ✅ `self_assessments` - Zen Hub assessments
- ✅ `work_schedules` - Work schedule tracking

**Foreign Key Relationships:**

- ✅ `skills.profile_id` → `profiles.id`
- ✅ `matching_profiles.profile_id` → `profiles.id`
- ✅ `assignments.org_id` → `organizations.id`
- ✅ `matches.profile_id` → `profiles.id`
- ✅ `matches.assignment_id` → `assignments.id`
- ✅ `experiences.user_id` → `profiles.id`
- ✅ `education.user_id` → `profiles.id`
- ✅ `volunteering.user_id` → `profiles.id`
- ✅ `organization_members.user_id` → `profiles.id`
- ✅ `organization_members.org_id` → `organizations.id`

---

## Phase 2: Individual Flows Testing

### 2.1 Authentication & Onboarding (I-00 to I-04)

#### I-00 Landing Page

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to `/`
  2. Verify signup CTA is visible
  3. Click "Sign up" button
  4. Verify analytics tracking (check network tab)
- **Database Check:** N/A (landing page)

#### I-01 Account Creation

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Test email signup: `/signup`
  2. Test Google OAuth: Click "Sign in with Google"
  3. Test LinkedIn OAuth: Click "Sign in with LinkedIn"
  4. Verify user created in `profiles` table
- **Database Verification:**
  ```sql
  SELECT id, email, created_at FROM profiles ORDER BY created_at DESC LIMIT 1;
  ```

#### I-02 Consent & Policy

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. After signup, verify consent modal appears
  2. Test "Ask AI" explanation feature
  3. Accept required consents
  4. Verify consent records in database
- **Database Verification:**
  ```sql
  SELECT * FROM audit_logs WHERE action = 'consent_accepted' ORDER BY created_at DESC LIMIT 1;
  ```

#### I-03 First-Run Tour

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Login as new user (tour_completed = false)
  2. Verify tour starts automatically
  3. Complete all 8 steps
  4. Verify `tour_completed` flag updated in DB
- **Database Verification:**
  ```sql
  SELECT tour_completed FROM profiles WHERE id = '<user_id>';
  ```

#### I-04 Home Dashboard

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to `/app/i/home`
  2. Verify tiles load (Matches, Expertise, Zen Hub, etc.)
  3. Click each tile, verify deep-linking works
  4. Check dashboard load time (should be < 2.0s P75)

### 2.2 Profile Setup (I-05 to I-10)

#### I-05 Profile Basics

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to `/app/i/profile`
  2. Upload avatar image
  3. Upload cover image
  4. Add headline, location, timezone, languages
  5. Save and verify data persists
- **Database Verification:**
  ```sql
  SELECT avatar_url, cover_url, headline, location, timezone, languages
  FROM profiles WHERE id = '<user_id>';
  ```

#### I-06 Mission & Vision

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Open Mission & Vision modal
  2. Enter mission (≤300 chars)
  3. Enter vision (≤300 chars)
  4. Set visibility (private default)
  5. Save and verify
- **Database Verification:**
  ```sql
  SELECT mission, vision, mission_visibility, vision_visibility
  FROM profiles WHERE id = '<user_id>';
  ```

#### I-07 Values & Causes

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Values & Causes section
  2. Select up to 5 values
  3. Select up to 5 causes
  4. Save and verify
- **Database Verification:**
  ```sql
  SELECT values, causes FROM profiles WHERE id = '<user_id>';
  ```

#### I-08 Work Experience

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Journey → Work tab
  2. Add work experience entry
  3. Fill: Organization, Role, Dates, What I did, Impact
  4. Link to skills (optional)
  5. Save and verify
- **Database Verification:**
  ```sql
  SELECT * FROM experiences WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

#### I-09 Learning Experience

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Journey → Learning tab
  2. Add education entry
  3. Fill: Provider, Credential, Dates, Why I chose this
  4. Save and verify
- **Database Verification:**
  ```sql
  SELECT * FROM education WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

#### I-10 Volunteering

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Volunteering section
  2. Add volunteering entry
  3. Fill: Organization, Project, Role, Dates
  4. Link to Values/Causes
  5. Save and verify
- **Database Verification:**
  ```sql
  SELECT * FROM volunteering WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

### 2.3 Expertise Atlas (I-11 to I-14)

#### I-11 Hub Introduction

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to `/app/i/expertise`
  2. Verify "About" section is collapsible
  3. Choose "Guided" mode
  4. Choose "Explore Freely" mode
  5. Verify mode preference saved

#### I-12 Taxonomy Navigation

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Click "Add" on an L1 domain card
  2. Select L3 category from picker
  3. Choose specific L4 skill
  4. Verify navigation flow works
- **Database Verification:**
  ```sql
  SELECT * FROM skills_taxonomy WHERE code = '<skill_code>';
  ```

#### I-13 Skill Creation

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. After selecting L4, open skill creation form
  2. Set self-assessed Level (0-5)
  3. Attach Proof (link/file)
  4. Request Verification (optional)
  5. Set Recency (last used)
  6. Link to Experiences
  7. Save and verify
- **Database Verification:**
  ```sql
  SELECT * FROM skills WHERE profile_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

#### I-14 Expertise Dashboard

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. After adding skills, verify charts appear
  2. Check Recency chart
  3. Check Skill Wheel
  4. Check Coverage Heatmap
  5. Verify all charts use real data

### 2.4 Matching (I-15 to I-19)

#### I-15 Matching Profile

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to `/app/i/matching`
  2. Set focus areas/roles/sectors
  3. Set alignment weighting (Mission/Impact ↔ Skills/Tools)
  4. Review preview sample matches
  5. Save and verify
- **Database Verification:**
  ```sql
  SELECT * FROM matching_profiles WHERE profile_id = '<user_id>';
  ```

#### I-16 Constraints & Visibility

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Set salary range
  2. Set location preferences
  3. Set work setting (remote/hybrid/onsite)
  4. Set contract type
  5. Configure visibility settings
  6. Save and verify
- **Database Verification:**
  ```sql
  SELECT salary_min, salary_max, location_mode, visibility_settings
  FROM matching_profiles WHERE profile_id = '<user_id>';
  ```

#### I-17 Matching Results

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Set refresh schedule (daily/weekly/monthly)
  2. View "Assigned Matches" bucket
  3. View "Open Opportunities" bucket
  4. Save interesting items
  5. Verify matches generated
- **Database Verification:**
  ```sql
  SELECT * FROM matches WHERE profile_id = '<user_id>' ORDER BY score DESC LIMIT 10;
  ```

#### I-18 Rank Transparency

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Open a matched assignment
  2. Verify "Why you match" subscores displayed
  3. Verify rank information shown (or band if privacy)
  4. Check PAC contribution visible
- **API Test:**
  ```bash
  GET /api/match/explain/<match_id>
  ```

#### I-19 Express Interest

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. From match detail, click "Express Interest"
  2. Review what will be shared
  3. Confirm consent
  4. Verify appears in org's ranked list
- **Database Verification:**
  ```sql
  SELECT * FROM match_interest WHERE match_id = '<match_id>' AND profile_id = '<user_id>';
  ```

### 2.5 Communication & Interviews (I-20 to I-22)

#### I-20 Secure Messaging

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Open message thread
  2. Type message (verify paste is disabled)
  3. Try to paste content (should be blocked)
  4. Try to upload file (should be blocked)
  5. Send message and verify saved
- **Database Verification:**
  ```sql
  SELECT * FROM conversations WHERE id = '<conversation_id>';
  ```

#### I-21 Interview Scheduling

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. From messaging, propose interview slot
  2. Select 30-minute slot within 7 days
  3. Verify calendar sync (if enabled)
  4. Verify video call link generated (Zoom/Google Meet)
  5. Confirm interview
- **Database Verification:**
  ```sql
  SELECT * FROM interviews WHERE conversation_id = '<conversation_id>' ORDER BY created_at DESC LIMIT 1;
  ```

#### I-22 Decision Window

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. After interview, verify 48h deadline shown
  2. Make decision (accept/decline)
  3. Provide feedback
  4. Verify feedback delivered
- **Database Verification:**
  ```sql
  SELECT * FROM decisions WHERE interview_id = '<interview_id>';
  ```

### 2.6 Settings & Data (I-23 to I-25)

#### I-23 Account & Privacy

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to `/app/i/settings`
  2. Change email, password
  3. Manage sessions
  4. Toggle visibility defaults
  5. Set notification preferences
  6. Verify all changes persist
- **Database Verification:**
  ```sql
  SELECT email, notification_preferences FROM profiles WHERE id = '<user_id>';
  ```

#### I-24 Data Portability

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Settings → Data
  2. Click "Export JSON"
  3. Download file
  4. Verify JSON structure
  5. Test import: Upload JSON
  6. Preview changes
  7. Confirm import
  8. Verify data restored
- **API Test:**
  ```bash
  GET /api/user/export
  POST /api/data-import
  ```

#### I-25 Delete Account

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Settings → Danger Zone
  2. Read consequences
  3. Type confirmation phrase
  4. Optional: Export reminder
  5. Delete account
  6. Verify soft-delete (30 days)
  7. Verify hard-delete after grace period
- **Database Verification:**
  ```sql
  SELECT deleted_at FROM profiles WHERE id = '<user_id>';
  ```

### 2.7 Zen Hub (I-26 to I-30)

#### I-26 Quick Check-in

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to `/app/i/zen`
  2. Click "How do you feel now?"
  3. Select mood
  4. Verify UI adapts (if high anxiety, show minimal elements)
  5. Complete optional practice
  6. Verify check-in saved privately
- **Database Verification:**
  ```sql
  SELECT * FROM wellbeing_checkins WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

#### I-27 Self-Assessments

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Zen Hub → Assessments
  2. Pick questionnaire
  3. Complete assessment
  4. View visualized result
  5. Verify stored privately
- **Database Verification:**
  ```sql
  SELECT * FROM self_assessments WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

#### I-28 Work Schedule

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Zen Hub → Schedule
  2. Enter weekly schedule
  3. Add side projects/volunteering
  4. View total load
  5. Verify alerts when exceeding thresholds
- **Database Verification:**
  ```sql
  SELECT * FROM work_schedules WHERE user_id = '<user_id>';
  ```

#### I-29 Toolkit

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Zen Hub → Explore
  2. Browse resource cards
  3. Click external link
  4. Verify "external link" labeling
  5. Verify click tracking

#### I-30 Local Discovery

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Zen Hub → Local
  2. Share location (optional)
  3. View nearby events
  4. Save or open link
  5. Verify location cleared when requested

---

## Phase 3: Organization Flows Testing

### 3.1 Onboarding (O-01 to O-07)

#### O-01 Landing → Trial

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to `/` (org variant)
  2. Click "Start Free Trial (Organizations)"
  3. View value cards
  4. Proceed to signup

#### O-02 Organization Sign-Up

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Choose "Organization account"
  2. Enter name, work email, title, password
  3. Submit
  4. Verify email
  5. Verify org created in DB
- **Database Verification:**
  ```sql
  SELECT * FROM organizations WHERE slug = '<org_slug>';
  ```

#### O-03 Minimal Org Setup

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Enter org slug
  2. Enter display name
  3. Enter legal name
  4. Save
  5. Verify slug uniqueness enforced
- **Database Verification:**
  ```sql
  SELECT slug, "displayName", legal_name FROM organizations WHERE id = '<org_id>';
  ```

#### O-04 Trial Activation

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. View value cards
  2. Accept ToS/Privacy
  3. Start trial
  4. Verify trial dates set
  5. Verify seat limit (5 for free tier)
- **Database Verification:**
  ```sql
  SELECT trial_start_at, trial_end_at, seat_limit FROM organizations WHERE id = '<org_id>';
  ```

#### O-05 First-Run Tour

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Verify tour starts automatically
  2. Complete 6 steps
  3. Verify completion flag saved
- **Database Verification:**
  ```sql
  SELECT tour_completed FROM profiles WHERE id = '<user_id>' AND persona = 'org_member';
  ```

#### O-06 Structure Overview

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. View tab introductions
  2. Navigate to each tab
  3. Verify "why it matters" explanations

#### O-07 Account Linking

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Link personal account to org account
  2. Switch context via header
  3. Verify context reflects chosen mode
- **Database Verification:**
  ```sql
  SELECT * FROM organization_members WHERE user_id = '<user_id>';
  ```

### 3.2 Team & Profile (O-08 to O-12)

#### O-08 Team Setup

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Team tab
  2. Create departments
  3. Set hierarchy
  4. Invite members (up to 5 for trial)
  5. Assign roles and departments
  6. Verify seat usage displayed
- **Database Verification:**
  ```sql
  SELECT * FROM organization_members WHERE org_id = '<org_id>';
  SELECT COUNT(*) as seat_count FROM organization_members WHERE org_id = '<org_id>' AND status = 'active';
  ```

#### O-09 Org Profile

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Profile tab
  2. Enter org number/registry
  3. Add locations, industries
  4. Set legal structure
  5. Add ownership & voting rights
  6. Add mission/vision/values/causes
  7. Upload logo & cover
  8. Verify public vs private fields respected
- **Database Verification:**
  ```sql
  SELECT * FROM organizations WHERE id = '<org_id>';
  ```

#### O-10 Impact Areas

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Profile → Impact Areas
  2. Add impact area
  3. Fill fields with guidance
  4. Save draft
  5. Publish (public by design)
  6. Verify visible on public profile
- **Database Verification:**
  ```sql
  SELECT * FROM impact_stories WHERE org_id = '<org_id>';
  ```

#### O-11 Projects

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Profile → Projects
  2. Create project
  3. Mark confidential/NDA if needed
  4. Save draft/publish
  5. Verify visibility enforced
- **Database Verification:**
  ```sql
  SELECT * FROM organization_projects WHERE org_id = '<org_id>';
  ```

#### O-12 Bindings

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Link project to team members
  2. Link project to competencies (Atlas)
  3. Link impact area to competencies
  4. Verify relationships appear in Team and Atlas views
- **Database Verification:**
  ```sql
  SELECT * FROM project_skills WHERE project_id = '<project_id>';
  ```

### 3.3 Assignments & Matching (O-13 to O-17)

#### O-13 Assignment Creation (5-Step)

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Assignments → Create
  2. **Step 1:** Business Value - assign stakeholders, draft BV
  3. **Step 2:** Target Outcomes - measurable outcomes
  4. **Step 3:** Weight Matrix - mission/purpose, expertise, work mode weights
  5. **Step 4:** Practicals - budget, location, availability
  6. **Step 5:** Expertise Mapping - pick competencies, tie to BV/TO
  7. Review and save draft
  8. Verify all fields saved
- **Database Verification:**
  ```sql
  SELECT * FROM assignments WHERE id = '<assignment_id>';
  SELECT * FROM assignment_expertise_matrix WHERE assignment_id = '<assignment_id>';
  ```

#### O-14 Publish Assignment

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Review assignment summary
  2. Confirm visibility
  3. Publish
  4. Verify status = 'active'
  5. Verify matching pipeline starts
- **Database Verification:**
  ```sql
  SELECT status, published_at FROM assignments WHERE id = '<assignment_id>';
  ```

#### O-15 Intake Matches

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. After publishing, wait for matches (or trigger manually)
  2. Verify Top 5 candidates shown (free tier)
  3. Verify ranked list with subscores
  4. Verify "why this match" explanations
- **Database Verification:**
  ```sql
  SELECT * FROM matches WHERE assignment_id = '<assignment_id>' ORDER BY score DESC LIMIT 5;
  ```

#### O-16 Candidate Pipeline

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Open candidate from shortlist
  2. Open message thread
  3. Propose 30-min interview slot (within 7 days)
  4. Verify video call link generated (Zoom/Google Meet)
  5. Auto-invite assigned stakeholders
  6. Confirm time
  7. Verify interview created
- **Database Verification:**
  ```sql
  SELECT * FROM interviews WHERE assignment_id = '<assignment_id>' ORDER BY created_at DESC LIMIT 1;
  ```

#### O-17 Decision & Feedback

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. After interview, collect stakeholder inputs
  2. Choose decision (hire/advance/hold/reject)
  3. Send personalized feedback within 48h
  4. Verify candidate informed
  5. Verify pipeline updated
- **Database Verification:**
  ```sql
  SELECT * FROM decisions WHERE interview_id = '<interview_id>';
  ```

### 3.4 Enterprise Features (O-18 to O-20)

#### O-18 Enterprise Atlas

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Atlas tab
  2. View collapsible "About" section
  3. View dashboard graphs (with mock data during tour)
  4. Verify reverts to empty after tour
- **Database Verification:**
  ```sql
  SELECT * FROM capabilities WHERE org_id = '<org_id>';
  ```

#### O-19 Competencies

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. View six L1 domain cards
  2. Click L1, see only added L2 categories
  3. Select L2, see only added L3
  4. Expand L4 competencies
  5. Add/edit competencies
  6. Bind to Impact Areas and Projects
  7. Verify saved
- **Database Verification:**
  ```sql
  SELECT * FROM capabilities WHERE org_id = '<org_id>';
  ```

#### O-20 Settings & Security

- **Status:** ⏳ PENDING MANUAL TEST
- **Test Steps:**
  1. Navigate to Settings
  2. Change password
  3. Setup MFA
  4. Manage privacy defaults
  5. Manage team/roles
  6. Export JSON of org data
  7. Test delete org (with multi-step confirmation)
  8. Verify all changes persist
- **Database Verification:**
  ```sql
  SELECT mfa_enabled FROM organizations WHERE id = '<org_id>';
  ```

---

## Phase 4: Database Persistence Verification

### 4.1 CRUD Operations Testing

**Status:** ⏳ IN PROGRESS

- **Create Operations:** To be tested via manual flows above
- **Read Operations:** To be verified via database queries
- **Update Operations:** To be tested via edit flows
- **Delete Operations:** To be tested via delete flows

### 4.2 Relationship Integrity

**Status:** ✅ VERIFIED (Schema Level)

All foreign key relationships confirmed in schema verification.

### 4.3 Transaction Safety

**Status:** ⏳ PENDING TEST

- Test rollback on errors
- Verify atomic operations
- Test concurrent access

---

## Phase 5: Manual Button & Function Testing

### 5.1 UI Component Testing

**Status:** ⏳ PENDING MANUAL TEST

**Checklist:**

- [ ] All buttons trigger correct actions
- [ ] Form submissions save to DB
- [ ] Navigation links route correctly
- [ ] Modals open/close properly
- [ ] Dropdowns and selectors work
- [ ] File uploads function
- [ ] Image cropping works
- [ ] Drag-and-drop (dashboard tiles) works

### 5.2 Interactive Features

**Status:** ⏳ PENDING MANUAL TEST

- [ ] Real-time updates (matches, messages)
- [ ] File uploads (avatars, proofs, documents)
- [ ] Image compression
- [ ] Form validation
- [ ] Error states display correctly

### 5.3 Error Handling

**Status:** ⏳ PENDING TEST

- [ ] Validation errors display
- [ ] Network failure recovery
- [ ] User-friendly error messages
- [ ] Error states don't corrupt DB

---

## Phase 6: Integration Testing

### 6.1 API Endpoint Testing

**Status:** ⏳ PENDING TEST

**Critical Endpoints to Test:**

- [ ] `GET /api/health` - Health check
- [ ] `GET /api/user/me` - User profile
- [ ] `POST /api/profile` - Update profile
- [ ] `GET /api/expertise/user-skills` - Get skills
- [ ] `POST /api/expertise/user-skills` - Add skill
- [ ] `POST /api/match/assignment` - Generate matches
- [ ] `GET /api/assignments` - List assignments
- [ ] `POST /api/assignments` - Create assignment
- [ ] `GET /api/matching/profile` - Get matches for profile
- [ ] `POST /api/match/interest` - Express interest
- [ ] `POST /api/interviews/schedule` - Schedule interview
- [ ] `GET /api/user/export` - Export data
- [ ] `POST /api/data-import` - Import data
- [ ] `POST /api/wellbeing/checkin` - Zen Hub check-in

### 6.2 External Integrations

**Status:** ⏳ PENDING TEST

- [ ] Email delivery (verification, attestations)
- [ ] OAuth flows (Google, LinkedIn)
- [ ] Video conferencing (Zoom, Google Meet)
- [ ] Map/geocoding services

---

## Phase 7: Performance & Reliability

### 7.1 Performance Testing

**Status:** ⏳ PENDING TEST

**Targets:**

- Page TTI P95 ≤ 2.5s (desktop)
- Page TTI P95 ≤ 3.5s (mobile)
- API P95 ≤ 1.5s
- API P99 ≤ 3s

### 7.2 Reliability Testing

**Status:** ⏳ PENDING TEST

- [ ] Database connection recovery
- [ ] Retry logic on failures
- [ ] Graceful degradation
- [ ] Backup/restore procedures

---

## Summary

### Completed ✅

- Database connectivity verified
- Database schema verified
- All required tables exist
- Foreign key relationships confirmed

### In Progress ⏳

- Individual flows testing (manual)
- Organization flows testing (manual)
- API endpoint testing
- Performance testing

### Pending ⏳

- Manual UI component testing
- Integration testing
- Error handling testing
- Reliability testing

---

## Next Steps

1. **Manual Testing:** Execute all manual test steps above
2. **API Testing:** Test all critical API endpoints
3. **Performance Testing:** Measure and verify SLA targets
4. **Bug Reporting:** Document any issues found
5. **Final Report:** Generate comprehensive test report

---

**Last Updated:** 2025-01-27
