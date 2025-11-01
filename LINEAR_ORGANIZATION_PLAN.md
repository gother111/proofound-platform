# Linear Workspace Organization Plan for Proofound

**Created:** January 31, 2025  
**Purpose:** Complete organizational structure for Linear workspace based on project status

---

## 📋 Workspace Structure Recommendation

### Teams (Suggested)

1. **Engineering** (Primary team)
   - Full-stack developers
   - All technical implementation tasks

2. **Product** (Optional)
   - Product management
   - Design coordination
   - User stories refinement

### Projects (Suggested)

1. **Proofound MVP** (Primary project)
   - All current sprint work
   - Core features

2. **Skills Taxonomy** (Epic Project)
   - E1: Skills Taxonomy System
   - Related data engineering work

3. **Matching System** (Epic Project)
   - E2-E7: Matching-related epics
   - Algorithm improvements

4. **Infrastructure** (Maintenance Project)
   - DevOps tasks
   - Database migrations
   - Deployment tasks

---

## ✅ COMPLETED WORK (Create as Closed Issues)

### Epic: Foundation & Infrastructure

#### Project Foundation ✅
- **Title:** Next.js 15 Setup with TypeScript
- **Status:** Done
- **Labels:** `completed`, `infrastructure`, `foundation`
- **Points:** Already completed

#### Design System ✅
- **Title:** Design System Implementation
- **Status:** Done
- **Description:** Brand tokens, motion tokens, Tailwind config, shadcn/ui setup
- **Labels:** `completed`, `design-system`, `ui`
- **Files:** `src/design/brand-tokens.json`, `src/design/motion-tokens.json`

#### Database Schema ✅
- **Title:** Complete Database Schema with Drizzle ORM
- **Status:** Done
- **Description:** All tables defined, RLS policies written, triggers configured
- **Labels:** `completed`, `database`, `schema`
- **Files:** `src/db/schema.ts`, `src/db/policies.sql`, `src/db/triggers.sql`

#### Supabase Integration ✅
- **Title:** Supabase MCP Setup and Integration
- **Status:** Done
- **Description:** Database connection, MCP tools configured, 23 tables accessible
- **Labels:** `completed`, `infrastructure`, `supabase`
- **Files:** `SUPABASE_MCP_COMPLETE.md`, `docs/SUPABASE_MCP_SETUP.md`

### Epic: Authentication & Authorization ✅

#### Authentication System ✅
- **Title:** Complete Authentication Flow
- **Status:** Done
- **Description:** Email/password, Google OAuth, password reset, session management
- **Labels:** `completed`, `authentication`, `security`
- **Files:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`

#### Auth Redesign ✅
- **Title:** Authentication Pages Redesign (Figma Alignment)
- **Status:** Done
- **Description:** Multi-step signup flows, universal sign-in, Figma color matching
- **Labels:** `completed`, `design`, `authentication`
- **Files:** `AUTH_REDESIGN_COMPLETE.md`, `components/auth/`

#### Email Templates ✅
- **Title:** Email Templates with React Email
- **Status:** Done
- **Description:** Verification, password reset, organization invitation emails
- **Labels:** `completed`, `email`, `templates`
- **Files:** `emails/VerifyEmail.tsx`, `emails/ResetPassword.tsx`, `emails/OrgInvite.tsx`

### Epic: User Interface & Dashboards ✅

#### Individual Dashboard ✅
- **Title:** Individual Dashboard Figma Alignment
- **Status:** Done
- **Description:** 3-column grid layout, all dashboard cards, empty states
- **Labels:** `completed`, `dashboard`, `ui`, `individual`
- **Files:** `DASHBOARD_ALIGNMENT_COMPLETE.md`, `src/app/app/i/home/page.tsx`

#### Organization Dashboard ✅
- **Title:** Organization Dashboard Figma Alignment
- **Status:** Done
- **Description:** Pixel-perfect match with individual dashboard, shared components
- **Labels:** `completed`, `dashboard`, `ui`, `organization`
- **Files:** `ORG_DASHBOARD_FIGMA_ALIGNMENT_COMPLETE.md`, `src/app/app/o/[slug]/home/page.tsx`

#### Profile Components ✅
- **Title:** Profile Empty State Restructure
- **Status:** Done
- **Description:** 3-tab structure (Impact, Journey, Service), empty states
- **Labels:** `completed`, `profile`, `ui`
- **Files:** `src/components/profile/EmptyProfileStateView.tsx`

### Epic: Core Matching System ✅

#### Matching Algorithm ✅
- **Title:** Core Matching System Implementation
- **Status:** Done
- **Description:** Multi-factor matching algorithm, scoring system, API endpoints
- **Labels:** `completed`, `matching`, `algorithm`
- **Files:** `src/lib/core/matching/`, `src/app/api/core/matching/`

#### Matching API ✅
- **Title:** Matching API Endpoints (13 endpoints)
- **Status:** Done
- **Description:** All matching/expertise endpoints functional
- **Labels:** `completed`, `api`, `matching`
- **Files:** `src/app/api/match/`, `src/app/api/matching-profile/`

---

## 🚧 IN PROGRESS / PARTIALLY COMPLETE

### Epic: Onboarding Flow ⚠️

#### Onboarding Page Structure ✅
- **Title:** Onboarding Persona Selection
- **Status:** Done
- **Labels:** `completed`, `onboarding`

#### Individual Setup Form ⚠️
- **Title:** Individual Setup Form Component
- **Status:** In Progress / Needs Completion
- **Priority:** Critical
- **Points:** 8
- **Labels:** `in-progress`, `onboarding`, `individual`, `blocker`
- **Acceptance Criteria:**
  - [ ] Complete form with all individual profile fields
  - [ ] Form validation and error handling
  - [ ] Integration with server actions
  - [ ] Redirect after completion

#### Organization Setup Form ⚠️
- **Title:** Organization Setup Form Component
- **Status:** In Progress / Needs Completion
- **Priority:** Critical
- **Points:** 8
- **Labels:** `in-progress`, `onboarding`, `organization`, `blocker`
- **Acceptance Criteria:**
  - [ ] Complete form with organization details
  - [ ] Team invite step
  - [ ] Form validation
  - [ ] Redirect after completion

### Epic: Auth Pages Completion ⚠️

#### Password Reset Flow ⚠️
- **Title:** Complete Password Reset Flow
- **Status:** Partial (templates done, flow needs completion)
- **Priority:** Critical
- **Points:** 5
- **Labels:** `in-progress`, `authentication`, `blocker`
- **Acceptance Criteria:**
  - [ ] Reset password request page working
  - [ ] Reset password confirmation page working
  - [ ] Email flow tested end-to-end

#### Email Verification Page ⚠️
- **Title:** Complete Email Verification Flow
- **Status:** Partial (templates done, page needs implementation)
- **Priority:** Critical
- **Points:** 3
- **Labels:** `in-progress`, `authentication`, `blocker`
- **Acceptance Criteria:**
  - [ ] Verification page renders correctly
  - [ ] Handles verification links
  - [ ] Shows success/error states

#### Accept Invite Page ⚠️
- **Title:** Organization Invitation Acceptance Page
- **Status:** Not Started
- **Priority:** Critical
- **Points:** 5
- **Labels:** `todo`, `authentication`, `organization`, `blocker`
- **Route:** `/app/o/[slug]/invitations/[token]`
- **Acceptance Criteria:**
  - [ ] Token verification
  - [ ] Accept/reject functionality
  - [ ] Email notifications
  - [ ] Test invite → accept flow

### Epic: UI Components ⚠️

#### Essential Components Needed
- **Title:** Add Essential UI Components
- **Status:** Partial (Button, Card, Input, Label done)
- **Priority:** High
- **Points:** 13
- **Labels:** `in-progress`, `ui`, `components`
- **Needed:**
  - [ ] Select (for dropdowns) - 3 pts
  - [ ] Dialog (for modals) - 3 pts
  - [ ] Toast (for notifications) - 3 pts
  - [ ] Avatar (for user profiles) - 2 pts
  - [ ] Badge (for status indicators) - 2 pts

### Epic: Middleware & Guards ⚠️

#### Complete Middleware Logic ⚠️
- **Title:** Complete Middleware Route Guards
- **Status:** Partial (basic structure exists)
- **Priority:** High
- **Points:** 8
- **Labels:** `in-progress`, `middleware`, `security`
- **Acceptance Criteria:**
  - [ ] Public route detection
  - [ ] Onboarding status checks
  - [ ] Organization access verification
  - [ ] Error boundaries (error.tsx, not-found.tsx)

---

## 📋 OUTSTANDING WORK (Create as Issues)

### Phase 1: Foundation (Sprint 1-2) - Critical Path

#### Epic 1: Skills Taxonomy System (55 pts) - NOT STARTED

**E1-US1: Design & Seed L1 Categories**
- **Priority:** P0 (Blocker)
- **Points:** 5
- **Status:** Not Started
- **Labels:** `epic-1`, `taxonomy`, `database`, `blocker`
- **Description:** Define and seed 6 top-level skill domains (L1)
- **Acceptance Criteria:**
  - [ ] 6 L1 categories defined with slugs, i18n names (EN, SV)
  - [ ] Migration `20250130_add_skills_taxonomy.sql` applied
  - [ ] `skills_categories` table populated
  - [ ] Unit tests verify category structure
- **Files:** `src/db/migrations/20250130_add_skills_taxonomy.sql`

**E1-US2: Define L2 & L3 Subcategories**
- **Priority:** P0 (Blocker)
- **Points:** 8
- **Status:** Not Started
- **Labels:** `epic-1`, `taxonomy`, `database`, `blocker`
- **Dependencies:** E1-US1
- **Acceptance Criteria:**
  - [ ] At least 7 L2 categories per L1 (42 total)
  - [ ] At least 3 L3 categories per L2 (126 total)
  - [ ] All categories have i18n names and descriptions
  - [ ] Seed data scripts created and tested

**E1-US3: Populate L4 Skills (Initial 1,000)**
- **Priority:** P0 (Blocker)
- **Points:** 13
- **Status:** Not Started
- **Labels:** `epic-1`, `taxonomy`, `data-engineering`, `blocker`
- **Dependencies:** E1-US2
- **Acceptance Criteria:**
  - [ ] 1,000+ L4 skills across all L1 categories
  - [ ] Each skill has: code, slug, i18n name, aliases, description, tags
  - [ ] Skill codes follow format: `XX.YY.ZZ.NNN`
  - [ ] Skills distributed across categories
  - [ ] CSV/JSON seed files for import
  - [ ] Duplicate detection scripts

**E1-US4: Implement Skill Embeddings**
- **Priority:** P1 (High)
- **Points:** 13
- **Status:** Not Started
- **Labels:** `epic-1`, `taxonomy`, `ml`, `embeddings`
- **Dependencies:** E1-US3
- **Acceptance Criteria:**
  - [ ] Embedding model selected (`multilingual-e5-large`, 768d)
  - [ ] Batch job generates embeddings for all skills
  - [ ] Embeddings stored in `skills_taxonomy.embedding` (pgvector)
  - [ ] HNSW index created for fast ANN search
  - [ ] Semantic search API endpoint
  - [ ] Performance: <10 min for 1,000 skills

**E1-US5: Update Existing Skills Table**
- **Priority:** P0 (Blocker)
- **Points:** 8
- **Status:** Not Started
- **Labels:** `epic-1`, `taxonomy`, `migration`, `blocker`
- **Dependencies:** E1-US3
- **Acceptance Criteria:**
  - [ ] Existing `skills.skill_id` mapped to `skills_taxonomy.code`
  - [ ] New column `skills.skill_code` populated
  - [ ] Backward compatibility maintained
  - [ ] Migration script with rollback plan
  - [ ] Update API to use `skill_code`

**E1-US6: Skills Taxonomy API Endpoints**
- **Priority:** P0 (Blocker)
- **Points:** 8
- **Status:** Not Started
- **Labels:** `epic-1`, `taxonomy`, `api`
- **Dependencies:** E1-US3
- **Acceptance Criteria:**
  - [ ] `GET /api/taxonomy/categories` - List L1 categories
  - [ ] `GET /api/taxonomy/categories/:cat_id/subcategories` - List L2
  - [ ] `GET /api/taxonomy/skills/search?q=...` - Search skills
  - [ ] `GET /api/taxonomy/skills/:code` - Get skill details
  - [ ] i18n support via Accept-Language header
  - [ ] Rate limited (60 req/min)
  - [ ] Cached (5 min TTL)

#### Epic 2: Project-Skills Linkage & Recency (34 pts) - NOT STARTED

**E2-US1: Create Projects Table & API**
- **Priority:** P0 (Blocker)
- **Points:** 13
- **Status:** Not Started
- **Labels:** `epic-2`, `projects`, `api`, `blocker`
- **Acceptance Criteria:**
  - [ ] `projects` table created via migration
  - [ ] API endpoints: POST, GET, PATCH, DELETE
  - [ ] Project fields: title, type, status, dates, outcomes, artifacts
  - [ ] Validation: dates, outcomes format
  - [ ] RLS policies: users manage own projects

**E2-US2: Link Skills to Projects**
- **Priority:** P0 (Blocker)
- **Points:** 8
- **Status:** Not Started
- **Labels:** `epic-2`, `projects`, `skills`, `blocker`
- **Dependencies:** E1 (Skills Taxonomy), E2-US1
- **Acceptance Criteria:**
  - [ ] `project_skills` table created
  - [ ] API: Add/remove skills from projects
  - [ ] Skill linkage includes: proficiency_level, usage_frequency, evidence_refs
  - [ ] UI: Multi-select skill picker
  - [ ] Validation: skill_code must exist

**E2-US3: Compute Recency Multiplier**
- **Priority:** P1 (High)
- **Points:** 8
- **Status:** Not Started
- **Labels:** `epic-2`, `projects`, `matching`, `algorithm`
- **Dependencies:** E2-US2
- **Acceptance Criteria:**
  - [ ] SQL function `compute_skill_recency_multiplier()` implemented
  - [ ] Formula: `exp(-α * months_since_last_used)`, α=0.0578
  - [ ] Ongoing projects → recency = 1.0
  - [ ] Trigger: auto-update on project changes
  - [ ] Unit tests: verify decay curve

**E2-US4: Compute Impact Score**
- **Priority:** P1 (High)
- **Points:** 5
- **Status:** Not Started
- **Labels:** `epic-2`, `projects`, `matching`, `algorithm`
- **Dependencies:** E2-US2
- **Acceptance Criteria:**
  - [ ] SQL function `compute_skill_impact_score()` implemented
  - [ ] Formula: avg(outcome_contribution × project.impact_score)
  - [ ] Trigger: auto-update on project outcome changes
  - [ ] Validation: impact_score ∈ [0, 1]

### Phase 2: Core Features (Sprint 3-5)

#### Epic 3: Expertise Atlas UI (40 pts) - NOT STARTED

**E3-US1: "My Projects" Tab**
- **Priority:** P0 (Blocker)
- **Points:** 13
- **Status:** Not Started
- **Labels:** `epic-3`, `ui`, `expertise-atlas`
- **Dependencies:** E2-US1
- **Route:** `/app/i/expertise/projects`
- **Acceptance Criteria:**
  - [ ] List view: cards for all projects
  - [ ] Filter by: type, status, date range
  - [ ] Sort by: start_date, end_date, title
  - [ ] Create project button → modal form
  - [ ] Edit/delete actions
  - [ ] Empty state

**E3-US2: Project Detail Page with Skills**
- **Priority:** P0 (Blocker)
- **Points:** 13
- **Status:** Not Started
- **Labels:** `epic-3`, `ui`, `expertise-atlas`
- **Dependencies:** E2-US2
- **Route:** `/app/i/expertise/projects/:id`
- **Acceptance Criteria:**
  - [ ] Sections: Overview, Skills, Outcomes, Artifacts, Verification
  - [ ] Skills section: add/remove, set proficiency (C1-C5)
  - [ ] Outcomes section: add metrics, qualitative impact
  - [ ] Artifacts section: upload docs, add links
  - [ ] Breadcrumb navigation

**E3-US3: Expertise Atlas List View**
- **Priority:** P1 (High)
- **Points:** 8
- **Status:** Not Started
- **Labels:** `epic-3`, `ui`, `expertise-atlas`
- **Dependencies:** E1 (Skills Taxonomy)
- **Route:** `/app/i/expertise`
- **Acceptance Criteria:**
  - [ ] Collapsible tree: L1 → L2 → L3 → L4 skills
  - [ ] Each skill shows: competency, verification status, recency indicator
  - [ ] Sort options: recency, competency, evidence strength, impact
  - [ ] Filter: by category, verification status, recency range
  - [ ] Search: type-ahead skill search

**E3-US4: Skill Detail Modal**
- **Priority:** P1 (High)
- **Points:** 6
- **Status:** Not Started
- **Labels:** `epic-3`, `ui`, `expertise-atlas`
- **Dependencies:** E2 (Projects), E3-US3
- **Acceptance Criteria:**
  - [ ] Modal opens on skill click
  -设定 ] Sections: Overview, Projects, Evidence, Related Skills
  - [ ] Overview: competency, experience, recency, impact score
  - [ ] Projects: list all projects using this skill
  - [ ] Evidence: upload new evidence, link artifacts
  - [ ] Related skills: show adjacent skills

### Phase 3: Advanced Matching (Sprint 5-7)

#### Epic 4: Skill Adjacency & Graph Matching (30 pts) - NOT STARTED

**E4-US1: Build Skill Adjacency Graph**
- **Priority:** P1 (High)
- **Points:** 13
- **Status:** Not Started
- **Labels:** `epic-4`, `matching`, `graph`, `algorithm`
- **Dependencies:** E1-US3 (L4 Skills)
- **Acceptance Criteria:**
  - [ ] Script generates edges for same L3 (distance=1)
  - [ ] Script generates edges for same L2 (distance=2)
  - [ ] Script generates edges for same L1 (distance=3)
  - [ ] `skill_adjacency` table populated (~50k edges)
  - [ ] Validation: no self-loops, no distance > 3

**E4-US2: Implement Adjacency Factor Function**
- **Priority:** P0 (Blocker)
- **Points:** 5
- **Status:** Not Started
- **Labels:** `epic-4`, `matching`, `algorithm`, `blocker`
- **Dependencies:** E4-US1
- **Acceptance Criteria:**
  - [ ] SQL function: `skill_adjacency_factor(code1, code2, lambda)`
  - [ ] Formula: `exp(-λ * distance)`, default λ=0.7
  - [ ] Lookup order: explicit graph edge → taxonomy distance → 0
  - [ ] Unit tests: verify decay curve
  - [ ] TypeScript equivalent function

**E4-US3: Integrate Adjacency into Matching**
- **Priority:** P0 (Blocker)
- **Points:** 8
- **Status:** Not Started
- **Labels:** `epic-4`, `matching`, `algorithm`, `blocker`
- **Dependencies:** E4-US2, Existing matching system
- **Acceptance Criteria:**
  - [ ] Update `computeSkillScore()` function
  - [ ] Apply adjacency factor × level fit × recency × evidence × impact
  - [ ] Test: job requires "Container Orchestration", candidate has "Kubernetes" → score ~0.4-0.5
  - [ ] Explanation includes adjacency info
  - [ ] Performance: matching 500 candidates < 2s

#### Epic 5: Assignment Creation Workflow (45 pts) - NOT STARTED

**E5-US1: Define Pipeline Templates**
- **Priority:** P1 (High)
- **Points:** 5
- **Status:** Not Started
- **Labels:** `epic-5`, `assignments`, `workflow`
- **Acceptance Criteria:**
  - [ ] UI: `/app/o/[slug]/settings/pipelines/new`
  - [ ] Define steps: name, stakeholder_role, required/optional
  - [ ] Predefined templates
  - [ ] Save pipeline as org default

**E5-US2: Assignment Creation with Pipeline**
- **Priority:** P0 (Blocker)
- **Points:** 13
- **Status:** Not Started
- **Labels:** `epic-5`, `assignments`, `workflow`, `blocker`
- **Dependencies:** E5-US1
- **Route:** `/app/o/[slug]/assignments/new`
- **Acceptance Criteria:**
  - [ ] Step 1: Select pipeline template
  - [ ] Step 2: Basic info (title, role, description, dates)
  - [ ] Step 3: Business value & outcomes
  - [ ] Assignment status: `draft` → `pipeline_in_progress`
  - [ ] Email notification to first stakeholder

**E5-US3: Stakeholder Step Completion**
- **Priority:** P0 (Blocker)
- **Points:** 13
- **Status:** Not Started
- **Labels:** `epic-5`, `assignments`, `workflow`, `blocker`
- **Dependencies:** E5-US2
- **Route:** `/app/o/[slug]/assignments/:id/pipeline/:step_id`
- **Acceptance Criteria:**
  - [ ] Form customized per stakeholder_role
  - [ ] HR: values, causes, work style, team culture
  - [ ] Tech Lead: required/nice-to-have skills
  - [ ] CEO: strategic notes, growth opportunities
  - [ ] Save as draft (auto-save every 30s)
  - [ ] Mark step as complete → notify next stakeholder

**E5-US4: Expertise Matrix UI**
- **Priority:** P0 (Blocker)
- **Points:** 8
- **Status:** Not Started
- **Labels:** `epic-5`, `assignments`, `ui`, `blocker`
- **Dependencies:** E5-US3, E1 (Taxonomy)
- **Acceptance Criteria:**
  - [ ] Skill selector: type-ahead search taxonomy
  - [ ] For each skill: set min_level (C1-C5), weight (0.5-2.0), required/nice-to-have
  - [ ] Link to outcome: dropdown of assignment outcomes
  - [ ] Preview: "This skill will contribute ~X% to match score"

**E5-US5: Final Review & Publish**
- **Priority:** P0 (Blocker)
- **Points:** 6
- **Status:** Not Started
- **Labels:** `epic-5`, `assignments`, `workflow`, `blocker`
- **Dependencies:** E5-US3, E5-US4
- **Route:** `/app/o/[slug]/assignments/:id/review`
- **Acceptance Criteria:**
  - [ ] Show all collected data
  - [ ] Edit any section if needed
  - [ ] Approve → status: `ready_to_publish`
  - [ ] Publish button → status: `published`
  - [ ] Fire analytics event
  - [ ] Trigger matching job within 24h

### Phase 4: Polish & Launch (Sprint 8-10)

#### Epic 6: Practical Fit Enhancements (38 pts) - NOT STARTED
#### Epic 7: Match Explainability (28 pts) - NOT STARTED
#### Epic 8: Sensitive Field Visibility (20 pts) - NOT STARTED
#### Epic 9: Testing & QA (30 pts) - NOT STARTED
#### Epic 10: Documentation & Deployment (20 pts) - NOT STARTED

*(Full details in IMPLEMENTATION_BACKLOG.md)*

---

## 🏷️ Labels to Create in Linear

### Status Labels
- `completed` - Work that's done and verified
- `in-progress` - Currently being worked on
- `todo` - Not started yet
- `blocked` - Blocked by dependencies or external factors

### Priority Labels
- `priority-p0` - Critical blocker (must complete)
- `priority-p1` - High priority
- `priority-p2` - Medium priority
- `priority-p3` - Low priority / nice to have

### Type Labels
- `epic-1` through `epic-10` - Epic markers
- `taxonomy` - Skills taxonomy work
- `matching` - Matching algorithm work
- `ui` - User interface work
- `api` - API/backend work
- `database` - Database schema/migrations
- `infrastructure` - DevOps/infrastructure
- `authentication` - Auth-related
- `onboarding` - Onboarding flow
- `dashboard` - Dashboard work
- `profile` - Profile features
- `projects` - Projects feature
- `expertise-atlas` - Expertise Atlas UI
- `assignments` - Assignment workflow
- `algorithm` - Algorithm work
- `security` - Security-related
- `testing` - Testing/QA
- `documentation` - Documentation

### Component Labels
- `individual` - Individual persona features
- `organization` - Organization persona features
- `shared` - Shared between personas

---

## 📊 Sprint Planning Structure

### Current Sprint (Sprint 1)
**Focus:** Complete critical blockers and start Skills Taxonomy

**Critical Blockers (Must Complete):**
1. Complete Individual Setup Form (8 pts)
2. Complete Organization Setup Form (8 pts)
3. Complete Password Reset Flow (5 pts)
4. Complete Email Verification Page (3 pts)
5. Implement Accept Invite Page (5 pts)
6. Complete Middleware Route Guards (8 pts)
7. Add Essential UI Components (13 pts)

**Total:** 50 points (slightly over capacity, prioritize top 3-4)

**Ready to Start:**
- E1-US1: Design & Seed L1 Categories (5 pts)
- E1-US2: Define L2 & L3 Subcategories (8 pts)

### Next Sprint (Sprint 2)
**Focus:** Skills Taxonomy Foundation

- E1-US3: Populate L4 Skills (13 pts)
- E1-US4: Implement Skill Embeddings (13 pts)
- E1-US5: Update Existing Skills Table (8 pts)
- E1-US6: Skills Taxonomy API Endpoints (8 pts)

**Total:** 42 points

---

## 📝 How to Use This Document

1. **Create Teams & Projects** in Linear first
2. **Create Labels** listed above
3. **Create Closed Issues** for all completed work (mark as Done)
4. **Create Active Issues** for in-progress items (mark current status)
5. **Create Backlog Issues** for all outstanding work
6. **Link Issues** to Epics (create Epic issues first)
7. **Assign Story Points** (using Fibonacci: 1, 2, 3, 5, 8, 13, 21)
8. **Set Priorities** (P0, P1, P2, P3)
9. **Add Dependencies** where specified
10. **Organize into Sprints** based on capacity (40 pts/sprint)

---

## 🎯 Quick Start Checklist

- [ ] Create Linear workspace
- [ ] Create teams (Engineering, Product)
- [ ] Create projects (MVP, Skills Taxonomy, Matching, Infrastructure)
- [ ] Create all labels
- [ ] Create Epic issues (E1-E10)
- [ ] Create closed issues for completed work
- [ ] Create active issues for in-progress work
- [ ] Create backlog issues for outstanding work
- [ ] Link issues to epics
- [ ] Set up Sprint 1 board
- [ ] Assign story points and priorities
- [ ] Add dependencies
- [ ] Start Sprint 1!

---

**Note:** Once Linear MCP tools are available, I can automate this entire organization process. For now, this document provides the complete structure for manual setup.

