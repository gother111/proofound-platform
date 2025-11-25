# Manual Testing Checklist - PRD Flows

**Date:** 2025-01-27  
**Purpose:** Comprehensive manual testing of all PRD flows with database verification

---

## Pre-Testing Setup

- [ ] Development server running (`npm run dev`)
- [ ] Browser DevTools open (Network tab, Console tab)
- [ ] Database access ready (Supabase MCP or direct SQL access)
- [ ] Test accounts created (Individual and Organization)

---

## Phase 1: Individual Flows - Authentication & Onboarding

### I-00: Landing Page

- [ ] Navigate to `/`
- [ ] Verify page title contains "Proofound"
- [ ] Verify "Sign up" CTA button is visible
- [ ] Click "Sign up" button
- [ ] **DB Check:** Verify analytics event recorded (if implemented)

### I-01: Account Creation

- [ ] Navigate to `/auth/signup`
- [ ] Test email signup:
  - [ ] Enter email, password, name
  - [ ] Submit form
  - [ ] Verify email verification sent
- [ ] Test Google OAuth:
  - [ ] Click "Sign in with Google"
  - [ ] Complete OAuth flow
- [ ] Test LinkedIn OAuth:
  - [ ] Click "Sign in with LinkedIn"
  - [ ] Complete OAuth flow
- [ ] **DB Check:**
  ```sql
  SELECT id, display_name, created_at FROM profiles ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify new profile created
  - [ ] Verify email/name stored correctly

### I-02: Consent & Policy

- [ ] After signup, verify consent modal appears
- [ ] Test "Ask AI" explanation feature
- [ ] Read Terms of Service summary
- [ ] Read Privacy Policy summary
- [ ] Accept required consents
- [ ] **DB Check:**
  ```sql
  SELECT * FROM audit_logs WHERE action LIKE '%consent%' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify consent record saved

### I-03: First-Run Tour

- [ ] Login as new user (or reset tour_completed flag)
- [ ] Verify tour starts automatically
- [ ] Complete all 8 steps:
  - [ ] Step 1: Navigation reveal
  - [ ] Step 2: Dashboard reveal
  - [ ] Step 3: Profile hint
  - [ ] Step 4: Expertise Hub hint
  - [ ] Step 5: Matching Profile hint
  - [ ] Step 6: Zen Hub hint
  - [ ] Step 7: Settings hint
  - [ ] Step 8: "Start with your Profile" suggestion
- [ ] **DB Check:**
  ```sql
  SELECT tour_completed FROM profiles WHERE id = '<user_id>';
  ```

  - [ ] Verify `tour_completed = true`

### I-04: Home Dashboard

- [ ] Navigate to `/app/i/home`
- [ ] Verify tiles load:
  - [ ] Matches tile
  - [ ] Expertise Depth tile
  - [ ] Zen Hub tile
  - [ ] Next Best Action tile
- [ ] Click each tile, verify deep-linking works
- [ ] **Performance Check:** Dashboard load time < 2.0s
- [ ] **DB Check:** Verify tiles show real data (not just placeholders)

---

## Phase 2: Individual Flows - Profile Setup

### I-05: Profile Basics

- [ ] Navigate to `/app/i/profile`
- [ ] Upload avatar image:
  - [ ] Select image file
  - [ ] Crop/resize if needed
  - [ ] Save
- [ ] Upload cover image:
  - [ ] Select image file
  - [ ] Save
- [ ] Add headline (e.g., "Senior Software Engineer")
- [ ] Add location
- [ ] Select timezone
- [ ] Add languages
- [ ] Save all changes
- [ ] **DB Check:**
  ```sql
  SELECT avatar_url, cover_url, headline, location, timezone, languages
  FROM profiles WHERE id = '<user_id>';
  ```

  - [ ] Verify all fields saved correctly

### I-06: Mission & Vision

- [ ] Open Mission & Vision modal/section
- [ ] Enter mission (≤300 chars):
  - [ ] Test with valid text
  - [ ] Test with >300 chars (should show error)
- [ ] Enter vision (≤300 chars)
- [ ] Set visibility to "Private" (default)
- [ ] Save
- [ ] Change visibility to "Public"
- [ ] Save again
- [ ] **DB Check:**
  ```sql
  SELECT mission, vision, mission_visibility, vision_visibility
  FROM profiles WHERE id = '<user_id>';
  ```

  - [ ] Verify mission and vision saved
  - [ ] Verify visibility settings saved

### I-07: Values & Causes

- [ ] Navigate to Values & Causes section
- [ ] Select up to 5 values:
  - [ ] Use search/typeahead
  - [ ] Verify duplicates prevented
- [ ] Select up to 5 causes:
  - [ ] Browse full list
  - [ ] Select causes
- [ ] Rank values if desired
- [ ] Save
- [ ] **DB Check:**
  ```sql
  SELECT values, causes FROM profiles WHERE id = '<user_id>';
  ```

  - [ ] Verify values and causes saved as arrays
  - [ ] Verify count ≤ 5 for each

### I-08: Work Experience

- [ ] Navigate to Journey → Work tab
- [ ] Click "Add Work Experience"
- [ ] Fill form:
  - [ ] Organization name
  - [ ] Role/Title
  - [ ] Start date
  - [ ] End date (or "Present")
  - [ ] Location (optional)
  - [ ] "What I did" (few sentences)
  - [ ] "Impact" (brief example)
  - [ ] Link to projects (optional)
- [ ] Save
- [ ] **DB Check:**
  ```sql
  SELECT * FROM experiences WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify experience saved
  - [ ] Verify all fields populated

### I-09: Learning Experience

- [ ] Navigate to Journey → Learning tab
- [ ] Click "Add Learning Experience"
- [ ] Fill form:
  - [ ] Provider (university, bootcamp, etc.)
  - [ ] Credential (degree, certificate)
  - [ ] Start date
  - [ ] End date
  - [ ] "Why I chose this" (private note)
- [ ] Save
- [ ] **DB Check:**
  ```sql
  SELECT * FROM education WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify education record saved

### I-10: Volunteering

- [ ] Navigate to Volunteering section
- [ ] Click "Add Volunteering"
- [ ] Fill form:
  - [ ] Organization
  - [ ] Project
  - [ ] Role
  - [ ] Start date
  - [ ] End date
  - [ ] Link to Values/Causes (optional)
- [ ] Save
- [ ] **DB Check:**
  ```sql
  SELECT * FROM volunteering WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify volunteering record saved

---

## Phase 3: Individual Flows - Expertise Atlas

### I-11: Hub Introduction

- [ ] Navigate to `/app/i/expertise`
- [ ] Verify "About" section is collapsible
- [ ] Read about Expertise Hub
- [ ] Choose "Guided" mode
- [ ] Verify guided flow starts
- [ ] Go back, choose "Explore Freely"
- [ ] Verify free exploration mode

### I-12: Taxonomy Navigation

- [ ] Click "Add" on an L1 domain card (e.g., "Tools & Technologies")
- [ ] Verify inline picker appears
- [ ] Select L3 category from list
- [ ] Choose specific L4 skill (e.g., "React")
- [ ] Verify navigation flow: L1 → L3 → L4
- [ ] **DB Check:**
  ```sql
  SELECT * FROM skills_taxonomy WHERE code = '<selected_skill_code>';
  ```

  - [ ] Verify skill exists in taxonomy

### I-13: Skill Creation

- [ ] After selecting L4, skill creation form opens
- [ ] Set self-assessed Level (0-5):
  - [ ] Test each level
  - [ ] Verify rubric definitions shown
- [ ] Attach Proof:
  - [ ] Upload file
  - [ ] Or add link
  - [ ] Verify file/link saved
- [ ] Request Verification (optional):
  - [ ] Enter verifier email
  - [ ] Add message
  - [ ] Submit request
- [ ] Set Recency (last used date)
- [ ] Link to Experiences:
  - [ ] Select relevant work/learning experience
  - [ ] Verify link created
- [ ] Save skill
- [ ] **DB Check:**
  ```sql
  SELECT * FROM skills WHERE profile_id = '<user_id>' AND skill_id = '<skill_code>' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify skill saved with all properties
  - [ ] Verify level, months_experience, proof saved

### I-14: Expertise Dashboard

- [ ] After adding 3+ skills, navigate to Expertise Dashboard
- [ ] Verify charts appear one-by-one with hints:
  - [ ] Recency Scatter chart
  - [ ] Skill Wheel
  - [ ] Coverage Heatmap
  - [ ] Relevance Bars
  - [ ] Credibility Pie
  - [ ] Verification Sources Pie
- [ ] Verify all charts use real data (not mock)
- [ ] Click on chart elements, verify deep-linking works
- [ ] **DB Check:** Verify charts reflect actual skill data

---

## Phase 4: Individual Flows - Matching

### I-15: Matching Profile

- [ ] Navigate to `/app/i/matching`
- [ ] Set focus areas:
  - [ ] Select roles/sectors
  - [ ] Select industries
- [ ] Set alignment weighting:
  - [ ] Move slider: Mission/Impact ↔ Skills/Tools
  - [ ] Verify preview updates
- [ ] Review preview sample matches
- [ ] Save preferences
- [ ] **DB Check:**
  ```sql
  SELECT * FROM matching_profiles WHERE profile_id = '<user_id>';
  ```

  - [ ] Verify matching profile saved
  - [ ] Verify focus areas and weights saved

### I-16: Constraints & Visibility

- [ ] Continue in Matching Profile
- [ ] Set salary range:
  - [ ] Min and max values
  - [ ] Select currency
- [ ] Set location preferences:
  - [ ] Remote/Hybrid/Onsite
  - [ ] Hard/Soft requirement
- [ ] Set work setting preferences
- [ ] Set contract type preferences
- [ ] Configure visibility:
  - [ ] What is visible to orgs
  - [ ] Test "salary overlaps" vs exact range
- [ ] Save
- [ ] **DB Check:**
  ```sql
  SELECT salary_min, salary_max, location_mode, visibility_settings
  FROM matching_profiles WHERE profile_id = '<user_id>';
  ```

  - [ ] Verify all constraints saved

### I-17: Matching Results

- [ ] Set refresh schedule (daily/weekly/monthly)
- [ ] View "Assigned Matches" bucket:
  - [ ] Verify matches appear
  - [ ] Verify ranking shown
- [ ] View "Open Opportunities" bucket:
  - [ ] Verify near-fit matches shown
- [ ] Save interesting items
- [ ] **DB Check:**
  ```sql
  SELECT * FROM matches WHERE profile_id = '<user_id>' ORDER BY score DESC LIMIT 10;
  ```

  - [ ] Verify matches generated
  - [ ] Verify scores calculated

### I-18: Rank Transparency

- [ ] Open a matched assignment
- [ ] Verify "Why you match" section shows:
  - [ ] Skills fit subscore
  - [ ] Constraints fit subscore
  - [ ] PAC (Purpose-Alignment Contribution) subscore
- [ ] Verify rank information:
  - [ ] "Your rank among top X" shown
  - [ ] Or rank band if privacy enabled
- [ ] **API Test:**
  ```bash
  curl http://localhost:3000/api/match/explain/<match_id>
  ```

  - [ ] Verify match explanation returned

### I-19: Express Interest

- [ ] From match detail, click "Express Interest"
- [ ] Review what will be shared:
  - [ ] Verify field-level visibility summary
  - [ ] Verify consent checkbox
- [ ] Confirm consent
- [ ] Verify success message
- [ ] **DB Check:**
  ```sql
  SELECT * FROM match_interest WHERE match_id = '<match_id>' AND profile_id = '<user_id>';
  ```

  - [ ] Verify interest recorded
  - [ ] Verify appears in org's candidate list

---

## Phase 5: Individual Flows - Communication & Interviews

### I-20: Secure Messaging

- [ ] Open message thread (from match or org contact)
- [ ] Type message:
  - [ ] Verify typing indicator works
- [ ] Try to paste content:
  - [ ] Verify paste is blocked
  - [ ] Verify gentle block message shown
- [ ] Try to upload file:
  - [ ] Verify upload blocked
  - [ ] Verify block message shown
- [ ] Send message
- [ ] Verify message appears in thread
- [ ] **DB Check:**
  ```sql
  SELECT * FROM conversations WHERE id = '<conversation_id>';
  ```

  - [ ] Verify message saved
  - [ ] Verify no attachments possible

### I-21: Interview Scheduling

- [ ] From messaging, propose interview
- [ ] Select 30-minute slot:
  - [ ] Verify only slots within 7 days shown
  - [ ] Select time slot
- [ ] Verify calendar sync (if enabled):
  - [ ] Check calendar for event
- [ ] Verify video call link generated:
  - [ ] Zoom or Google Meet link shown
- [ ] Confirm interview
- [ ] **DB Check:**
  ```sql
  SELECT * FROM interviews WHERE conversation_id = '<conversation_id>' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify interview created
  - [ ] Verify duration = 30 minutes
  - [ ] Verify scheduled_at within 7 days

### I-22: Decision Window

- [ ] After interview, verify 48h deadline shown
- [ ] Make decision:
  - [ ] Accept
  - [ ] Or Decline
- [ ] Provide feedback:
  - [ ] Enter personalized feedback
  - [ ] Submit
- [ ] Verify feedback delivered to candidate
- [ ] **DB Check:**
  ```sql
  SELECT * FROM decisions WHERE interview_id = '<interview_id>';
  ```

  - [ ] Verify decision recorded
  - [ ] Verify feedback saved
  - [ ] Verify within 48h SLA

---

## Phase 6: Individual Flows - Settings & Data

### I-23: Account & Privacy

- [ ] Navigate to `/app/i/settings`
- [ ] Change email:
  - [ ] Enter new email
  - [ ] Verify email
  - [ ] Save
- [ ] Change password:
  - [ ] Enter current password
  - [ ] Enter new password
  - [ ] Confirm new password
  - [ ] Save
- [ ] Manage sessions:
  - [ ] View active sessions
  - [ ] Revoke session
- [ ] Toggle visibility defaults
- [ ] Set notification preferences
- [ ] **DB Check:**
  ```sql
  SELECT email, notification_preferences FROM profiles WHERE id = '<user_id>';
  ```

  - [ ] Verify all changes persisted

### I-24: Data Portability

- [ ] Navigate to Settings → Data
- [ ] Export JSON:
  - [ ] Click "Export JSON"
  - [ ] Wait for file generation
  - [ ] Download file
  - [ ] Verify JSON structure valid
  - [ ] Verify all user data included
- [ ] Import JSON:
  - [ ] Click "Import JSON"
  - [ ] Upload valid JSON file
  - [ ] Preview changes shown
  - [ ] Confirm import
  - [ ] Verify data restored
- [ ] **API Test:**
  ```bash
  curl http://localhost:3000/api/user/export
  ```

  - [ ] Verify export endpoint works

### I-25: Delete Account

- [ ] Navigate to Settings → Danger Zone
- [ ] Read consequences
- [ ] Type confirmation phrase
- [ ] Optional: Export reminder shown
- [ ] Click "Delete Account"
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] **DB Check:**
  ```sql
  SELECT deleted_at FROM profiles WHERE id = '<user_id>';
  ```

  - [ ] Verify soft-delete (deleted_at set)
  - [ ] Verify hard-delete after 30 days (if applicable)

---

## Phase 7: Individual Flows - Zen Hub

### I-26: Quick Check-in

- [ ] Navigate to `/app/i/zen`
- [ ] Click "How do you feel now?"
- [ ] Select mood (1-5 scale)
- [ ] Verify UI adapts (if high anxiety, minimal elements shown)
- [ ] Complete optional 1-minute practice
- [ ] **DB Check:**
  ```sql
  SELECT * FROM wellbeing_checkins WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify check-in saved privately
  - [ ] Verify not used in ranking

### I-27: Self-Assessments

- [ ] Navigate to Zen Hub → Assessments
- [ ] Pick questionnaire (e.g., PHQ-9, GAD-7)
- [ ] Complete assessment
- [ ] View visualized result
- [ ] Verify result stored privately
- [ ] **DB Check:**
  ```sql
  SELECT * FROM self_assessments WHERE user_id = '<user_id>' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify assessment saved

### I-28: Work Schedule

- [ ] Navigate to Zen Hub → Schedule
- [ ] Enter weekly schedule:
  - [ ] Add work hours
  - [ ] Add side projects
  - [ ] Add volunteering hours
- [ ] View total load
- [ ] Set threshold for alerts
- [ ] Exceed threshold, verify alert shown
- [ ] **DB Check:**
  ```sql
  SELECT * FROM work_schedules WHERE user_id = '<user_id>';
  ```

  - [ ] Verify schedule saved

### I-29: Toolkit

- [ ] Navigate to Zen Hub → Explore
- [ ] Browse resource cards
- [ ] Click external link
- [ ] Verify "external link" labeling clear
- [ ] Verify click tracking (if implemented)

### I-30: Local Discovery

- [ ] Navigate to Zen Hub → Local
- [ ] Share location (optional):
  - [ ] Grant location permission
  - [ ] Verify coarse geolocation used
- [ ] View nearby events
- [ ] Save event
- [ ] Clear location
- [ ] Verify location cleared

---

## Phase 8: Organization Flows - Onboarding

### O-01: Landing → Trial

- [ ] Navigate to `/` (org variant)
- [ ] Click "Start Free Trial (Organizations)"
- [ ] View value cards:
  - [ ] Verify cards are scannable
  - [ ] Verify concise messaging
- [ ] Proceed to signup

### O-02: Organization Sign-Up

- [ ] Choose "Organization account"
- [ ] Enter:
  - [ ] Name
  - [ ] Work email
  - [ ] Title
  - [ ] Password
- [ ] Submit
- [ ] Verify email sent
- [ ] Verify email
- [ ] **DB Check:**
  ```sql
  SELECT * FROM organizations WHERE slug = '<org_slug>';
  ```

  - [ ] Verify org created

### O-03: Minimal Org Setup

- [ ] Enter org slug:
  - [ ] Test uniqueness (try duplicate slug)
  - [ ] Verify error if duplicate
- [ ] Enter display name
- [ ] Enter legal name
- [ ] Save
- [ ] **DB Check:**
  ```sql
  SELECT slug, display_name, legal_name FROM organizations WHERE id = '<org_id>';
  ```

  - [ ] Verify all fields saved

### O-04: Trial Activation

- [ ] View value cards
- [ ] Accept ToS/Privacy
- [ ] Optional: Note on security/privacy contact
- [ ] Start trial
- [ ] **DB Check:**
  ```sql
  SELECT trial_start_at, trial_end_at, seat_limit FROM organizations WHERE id = '<org_id>';
  ```

  - [ ] Verify trial dates set
  - [ ] Verify seat_limit = 5 (free tier)

### O-05: First-Run Tour

- [ ] Verify tour starts automatically
- [ ] Complete 6 steps:
  - [ ] Nav bar reveal
  - [ ] Dashboard cards reveal
  - [ ] Assignments hint
  - [ ] Candidates hint
  - [ ] Team hint
  - [ ] Settings hint
- [ ] **DB Check:**
  ```sql
  SELECT tour_completed FROM profiles WHERE id = '<user_id>' AND persona = 'org_member';
  ```

  - [ ] Verify tour_completed = true

### O-06: Structure Overview

- [ ] View tab introductions:
  - [ ] Profile tab
  - [ ] Assignments tab
  - [ ] Atlas tab
  - [ ] Team tab
  - [ ] Settings tab
- [ ] Verify "why it matters" explanations shown
- [ ] Navigate to each tab

### O-07: Account Linking

- [ ] Link personal account to org account:
  - [ ] Enter personal account email
  - [ ] Verify link
- [ ] Switch context via header:
  - [ ] Click context switcher
  - [ ] Select "Individual" mode
  - [ ] Verify Individual dashboard loads
  - [ ] Switch back to "Organization" mode
  - [ ] Verify Org dashboard loads
- [ ] **DB Check:**
  ```sql
  SELECT * FROM organization_members WHERE user_id = '<user_id>';
  ```

  - [ ] Verify membership record exists

---

## Phase 9: Organization Flows - Team & Profile

### O-08: Team Setup

- [ ] Navigate to Team tab
- [ ] Create departments:
  - [ ] Add department name
  - [ ] Set parent department (if hierarchy)
  - [ ] Save
- [ ] Set hierarchy:
  - [ ] Drag-and-drop departments
  - [ ] Verify hierarchy saved
- [ ] Invite members:
  - [ ] Enter work email
  - [ ] Assign role (Owner, Manager, Reviewer)
  - [ ] Assign department
  - [ ] Send invite
  - [ ] Verify seat count updates (max 5 for trial)
- [ ] **DB Check:**
  ```sql
  SELECT * FROM organization_members WHERE org_id = '<org_id>';
  SELECT COUNT(*) as seat_count FROM organization_members WHERE org_id = '<org_id>' AND status = 'active';
  ```

  - [ ] Verify members saved
  - [ ] Verify seat count ≤ 5

### O-09: Org Profile

- [ ] Navigate to Profile tab
- [ ] Enter org details:
  - [ ] Org number/registry
  - [ ] Locations
  - [ ] Industries
  - [ ] Legal structure
  - [ ] Ownership & voting rights
- [ ] Add mission/vision/values/causes
- [ ] Upload logo & cover
- [ ] Set visibility (public vs private)
- [ ] Save
- [ ] **DB Check:**
  ```sql
  SELECT * FROM organizations WHERE id = '<org_id>';
  ```

  - [ ] Verify all fields saved

### O-10: Impact Areas

- [ ] Navigate to Profile → Impact Areas
- [ ] Add impact area:
  - [ ] Enter title
  - [ ] Enter scope
  - [ ] Add metrics (optional)
  - [ ] Use field-level hints
- [ ] Save draft
- [ ] Publish (public by design)
- [ ] Verify visible on public org profile
- [ ] **DB Check:**
  ```sql
  SELECT * FROM impact_stories WHERE org_id = '<org_id>';
  ```

  - [ ] Verify impact area saved

### O-11: Projects

- [ ] Navigate to Profile → Projects
- [ ] Create project:
  - [ ] Enter name
  - [ ] Enter scope
  - [ ] Assign team members
  - [ ] Set status
  - [ ] Mark confidential/NDA if needed
- [ ] Save draft
- [ ] Publish
- [ ] Verify visibility enforced
- [ ] **DB Check:**
  ```sql
  SELECT * FROM organization_projects WHERE org_id = '<org_id>';
  ```

  - [ ] Verify project saved

### O-12: Bindings

- [ ] Link project to team members:
  - [ ] Select project
  - [ ] Add team members
  - [ ] Save
- [ ] Link project to competencies:
  - [ ] Select project
  - [ ] Select competencies from Atlas
  - [ ] Save
- [ ] Link impact area to competencies
- [ ] **DB Check:**
  ```sql
  SELECT * FROM project_skills WHERE project_id = '<project_id>';
  ```

  - [ ] Verify bindings saved

---

## Phase 10: Organization Flows - Assignments & Matching

### O-13: Assignment Creation (5-Step)

- [ ] Navigate to Assignments → Create
- [ ] **Step 1: Business Value**
  - [ ] Assign stakeholders (CTO, HR, Lead, CEO)
  - [ ] Draft Business Value text
  - [ ] Stakeholders can review/comment
- [ ] **Step 2: Target Outcomes**
  - [ ] Enter measurable outcomes
  - [ ] Set improvement targets
- [ ] **Step 3: Weight Matrix**
  - [ ] Set mission/purpose fit weight
  - [ ] Set expertise depth weight
  - [ ] Set work mode weight (onsite/hybrid/remote)
  - [ ] Mark hard/soft requirements
- [ ] **Step 4: Practicals**
  - [ ] Set budget/salary range
  - [ ] Set location
  - [ ] Set availability window
- [ ] **Step 5: Expertise Mapping**
  - [ ] Pick competencies from Atlas
  - [ ] Tie each to BV/TO
  - [ ] Mark education requirements
  - [ ] Add justification for education requirements
- [ ] Review summary
- [ ] Save draft
- [ ] **DB Check:**
  ```sql
  SELECT * FROM assignments WHERE id = '<assignment_id>';
  SELECT * FROM assignment_expertise_matrix WHERE assignment_id = '<assignment_id>';
  ```

  - [ ] Verify all fields saved
  - [ ] Verify expertise mappings saved

### O-14: Publish Assignment

- [ ] Review assignment summary
- [ ] Confirm visibility settings
- [ ] Click "Publish"
- [ ] Verify success message
- [ ] **DB Check:**
  ```sql
  SELECT status, published_at FROM assignments WHERE id = '<assignment_id>';
  ```

  - [ ] Verify status = 'active'
  - [ ] Verify published_at set
  - [ ] Verify matching pipeline triggered

### O-15: Intake Matches

- [ ] After publishing, wait for matches (or trigger manually)
- [ ] Verify Top 5 candidates shown (free tier)
- [ ] Verify ranked list:
  - [ ] Scores displayed
  - [ ] Subscores shown
- [ ] Verify "why this match" explanations
- [ ] **DB Check:**
  ```sql
  SELECT * FROM matches WHERE assignment_id = '<assignment_id>' ORDER BY score DESC LIMIT 5;
  ```

  - [ ] Verify matches generated
  - [ ] Verify top 5 returned

### O-16: Candidate Pipeline

- [ ] Open candidate from shortlist
- [ ] Open message thread
- [ ] Propose 30-min interview slot:
  - [ ] Verify only slots within 7 days shown
  - [ ] Select time slot
- [ ] Verify video call link generated:
  - [ ] Zoom or Google Meet link
- [ ] Auto-invite assigned stakeholders:
  - [ ] Verify stakeholders notified
- [ ] Confirm time
- [ ] **DB Check:**
  ```sql
  SELECT * FROM interviews WHERE assignment_id = '<assignment_id>' ORDER BY created_at DESC LIMIT 1;
  ```

  - [ ] Verify interview created
  - [ ] Verify duration = 30 minutes

### O-17: Decision & Feedback

- [ ] After interview, collect stakeholder inputs
- [ ] Choose decision:
  - [ ] Hire
  - [ ] Advance
  - [ ] Hold
  - [ ] Reject
- [ ] Send personalized feedback:
  - [ ] Enter feedback for each candidate
  - [ ] Submit within 48h
- [ ] Verify candidate informed
- [ ] **DB Check:**
  ```sql
  SELECT * FROM decisions WHERE interview_id = '<interview_id>';
  ```

  - [ ] Verify decision recorded
  - [ ] Verify feedback saved
  - [ ] Verify within 48h SLA

---

## Phase 11: Organization Flows - Enterprise Features

### O-18: Enterprise Atlas

- [ ] Navigate to Atlas tab
- [ ] View collapsible "About" section
- [ ] View dashboard graphs:
  - [ ] Verify mock data shown during tour
  - [ ] Verify reverts to empty after tour
- [ ] **DB Check:**
  ```sql
  SELECT * FROM capabilities WHERE org_id = '<org_id>';
  ```

  - [ ] Verify capabilities table accessible

### O-19: Competencies

- [ ] View six L1 domain cards
- [ ] Click L1, see only added L2 categories
- [ ] Select L2, see only added L3
- [ ] Expand L4 competencies
- [ ] Add/edit competencies:
  - [ ] Add new L4 competency
  - [ ] Edit existing competency
- [ ] Bind to Impact Areas:
  - [ ] Select competency
  - [ ] Link to impact area
- [ ] Bind to Projects:
  - [ ] Select competency
  - [ ] Link to project
- [ ] **DB Check:**
  ```sql
  SELECT * FROM capabilities WHERE org_id = '<org_id>';
  ```

  - [ ] Verify competencies saved

### O-20: Settings & Security

- [ ] Navigate to Settings
- [ ] Change password
- [ ] Setup MFA:
  - [ ] Enable 2FA
  - [ ] Scan QR code
  - [ ] Verify code
- [ ] Manage privacy defaults
- [ ] Manage team/roles
- [ ] Export JSON:
  - [ ] Click "Export Org Data"
  - [ ] Download JSON
  - [ ] Verify structure
- [ ] Test delete org:
  - [ ] Navigate to Danger Zone
  - [ ] Read consequences
  - [ ] Type confirmation phrase
  - [ ] Verify multi-step confirmation
  - [ ] (Do not actually delete)
- [ ] **DB Check:**
  ```sql
  SELECT mfa_enabled FROM organizations WHERE id = '<org_id>';
  ```

  - [ ] Verify MFA enabled

---

## Phase 12: Database Persistence Verification

### CRUD Operations

- [ ] **Create:** Verify all create operations write to DB
  - [ ] Profile creation
  - [ ] Skill creation
  - [ ] Assignment creation
  - [ ] Match generation
- [ ] **Read:** Verify all read operations return correct data
  - [ ] Profile retrieval
  - [ ] Skills retrieval
  - [ ] Matches retrieval
- [ ] **Update:** Verify all updates persist
  - [ ] Profile updates
  - [ ] Skill updates
  - [ ] Assignment updates
- [ ] **Delete:** Verify soft-delete then hard-delete
  - [ ] Profile deletion
  - [ ] Assignment deletion

### Relationship Integrity

- [ ] Verify foreign key constraints:
  - [ ] Skills → Profiles
  - [ ] Assignments → Organizations
  - [ ] Matches → Profiles & Assignments
  - [ ] Experiences → Profiles
- [ ] Verify cascade deletes (where applicable)
- [ ] Verify many-to-many relationships:
  - [ ] Skills ↔ Experiences
  - [ ] Projects ↔ Competencies

---

## Phase 13: Manual UI Component Testing

### Buttons

- [ ] All buttons trigger correct actions
- [ ] Buttons show loading states
- [ ] Buttons disabled when appropriate
- [ ] Button text is clear and actionable

### Forms

- [ ] All form fields validate correctly
- [ ] Error messages display clearly
- [ ] Form submissions save to DB
- [ ] Form resets after successful submission
- [ ] Autosave works (where applicable)

### Navigation

- [ ] All navigation links route correctly
- [ ] Breadcrumbs work (if present)
- [ ] Back button works
- [ ] Deep-linking works

### Modals

- [ ] Modals open correctly
- [ ] Modals close on backdrop click
- [ ] Modals close on ESC key
- [ ] Modals close on X button
- [ ] Modal content scrolls if needed

### Dropdowns & Selectors

- [ ] Dropdowns open/close correctly
- [ ] Options are selectable
- [ ] Search in dropdowns works
- [ ] Multi-select works (where applicable)

### File Uploads

- [ ] Avatar upload works
- [ ] Cover image upload works
- [ ] Document upload works
- [ ] File size validation works
- [ ] File type validation works
- [ ] Image compression works

### Drag-and-Drop

- [ ] Dashboard tiles can be reordered
- [ ] Drag feedback is clear
- [ ] Drop zones are clear
- [ ] Order persists after refresh

---

## Phase 14: Error Handling Testing

### Validation Errors

- [ ] Required fields show errors when empty
- [ ] Email format validation works
- [ ] Password strength validation works
- [ ] Date range validation works
- [ ] File size/type validation works

### Network Errors

- [ ] Network failure shows user-friendly message
- [ ] Retry button works
- [ ] Data not lost on network error
- [ ] Offline state handled gracefully

### Server Errors

- [ ] 500 errors show user-friendly message
- [ ] 404 errors show helpful message
- [ ] 403 errors show access denied message
- [ ] Error states don't corrupt DB

---

## Phase 15: Performance Testing

### Page Load Times

- [ ] Landing page: < 2.0s
- [ ] Dashboard: < 2.0s
- [ ] Profile page: < 2.0s
- [ ] Expertise page: < 2.0s
- [ ] Matching page: < 2.0s

### API Response Times

- [ ] Health check: < 500ms
- [ ] Profile fetch: < 1.5s
- [ ] Skills fetch: < 1.5s
- [ ] Matches generation: < 3s
- [ ] Assignment creation: < 2s

### Dashboard Tile Loading

- [ ] All tiles load within 2.0s
- [ ] Tiles load concurrently
- [ ] Skeleton loaders shown during load
- [ ] No layout shift on load

---

## Test Completion Checklist

- [ ] All Individual flows (I-00 to I-30) tested
- [ ] All Organization flows (O-01 to O-20) tested
- [ ] All database operations verified
- [ ] All buttons and functions manually tested
- [ ] All error scenarios tested
- [ ] Performance metrics measured
- [ ] Test report generated
- [ ] Bugs documented
- [ ] Recommendations provided

---

**Last Updated:** 2025-01-27
