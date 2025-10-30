# Proofound — Implementation Backlog

**Document Version:** 1.0
**Last Updated:** 2025-10-29
**Sprint Duration:** 2 weeks
**Team Capacity:** Estimate 40 story points per sprint (2 devs × 10 points/week)

---

## Table of Contents

1. [Epic Overview](#epic-overview)
2. [Phase 1: Foundation (Sprint 1-2)](#phase-1-foundation-sprint-1-2)
3. [Phase 2: Core Features (Sprint 3-5)](#phase-2-core-features-sprint-3-5)
4. [Phase 3: Advanced Matching (Sprint 6-8)](#phase-3-advanced-matching-sprint-6-8)
5. [Phase 4: Polish & Launch (Sprint 9-10)](#phase-4-polish--launch-sprint-9-10)
6. [Story Point Reference](#story-point-reference)
7. [Dependencies Map](#dependencies-map)

---

## Epic Overview

| Epic ID | Epic Name | Story Points | Priority | Sprints | Status |
|---------|-----------|--------------|----------|---------|--------|
| **E1** | Skills Taxonomy System | 55 | **Critical** | 1-2 | Not Started |
| **E2** | Project-Skills Linkage & Recency | 34 | **Critical** | 2-3 | Not Started |
| **E3** | Expertise Atlas UI | 40 | High | 3-4 | Not Started |
| **E4** | Skill Adjacency & Graph Matching | 30 | High | 4-5 | Not Started |
| **E5** | Assignment Creation Workflow | 45 | High | 5-6 | Not Started |
| **E6** | Practical Fit Enhancements | 38 | Medium | 6-7 | Not Started |
| **E7** | Match Explainability | 28 | Medium | 7-8 | Not Started |
| **E8** | Sensitive Field Visibility | 20 | Medium | 8 | Not Started |
| **E9** | Testing & QA | 30 | High | 9 | Not Started |
| **E10** | Documentation & Deployment | 20 | High | 10 | Not Started |

**Total**: 340 story points ≈ **10 sprints (20 weeks / 5 months)**

---

## Phase 1: Foundation (Sprint 1-2)

### Epic 1: Skills Taxonomy System (55 pts)

#### User Stories

**E1-US1: Design & Seed L1 Categories**
**Story Points**: 5
**Priority**: P0 (Blocker)

**As a** system architect
**I want** to define and seed the 6 top-level skill domains (L1)
**So that** all skills can be hierarchically organized

**Acceptance Criteria**:
- [ ] 6 L1 categories defined with slugs, i18n names (EN, SV)
- [ ] Migration `20250130_add_skills_taxonomy.sql` applied successfully
- [ ] `skills_categories` table populated with seed data
- [ ] Each category has display_order and icon assigned
- [ ] Unit tests verify category structure

**Technical Notes**:
- Categories: Technical, Design, Business, Communication, Research, Specialized
- Already defined in migration file

**Dependencies**: None

---

**E1-US2: Define L2 & L3 Subcategories**
**Story Points**: 8
**Priority**: P0 (Blocker)

**As a** content strategist
**I want** to define L2 and L3 subcategories for each L1 domain
**So that** skills can be granularly organized

**Acceptance Criteria**:
- [ ] At least 7 L2 categories per L1 (42 total)
- [ ] At least 3 L3 categories per L2 (126 total)
- [ ] All categories have i18n names (EN, SV) and descriptions
- [ ] Seed data scripts created and tested
- [ ] Documentation updated with category tree

**Technical Notes**:
- Start with Technical domain (most complex)
- Can parallelize other domains

**Dependencies**: E1-US1

---

**E1-US3: Populate L4 Skills (Initial 1,000)**
**Story Points**: 13
**Priority**: P0 (Blocker)

**As a** data engineer
**I want** to populate the skills_taxonomy table with 1,000+ L4 granular skills
**So that** users can select relevant skills for their profiles

**Acceptance Criteria**:
- [ ] 1,000+ L4 skills across all L1 categories
- [ ] Each skill has: code, slug, i18n name, aliases, description, tags
- [ ] Skill codes follow format: `01.03.01.142` (zero-padded)
- [ ] Skills distributed across categories (no empty L3s)
- [ ] CSV/JSON seed files for easy import
- [ ] Duplicate detection and validation scripts

**Technical Notes**:
- Phase 1: 1,000 skills (MVP)
- Phase 2: 5,000 skills (Beta)
- Phase 3: 10,000+ skills (GA)

**Dependencies**: E1-US2

---

**E1-US4: Implement Skill Embeddings**
**Story Points**: 13
**Priority**: P1 (High)

**As a** ML engineer
**I want** to generate multilingual embeddings for all skills
**So that** semantic search and adjacency can work

**Acceptance Criteria**:
- [ ] Embedding model selected (e.g., `multilingual-e5-large`, 768d)
- [ ] Batch job to generate embeddings for all skills
- [ ] Embeddings stored in `skills_taxonomy.embedding` (pgvector)
- [ ] HNSW index created for fast ANN search
- [ ] Test: semantic search for "database" returns PostgreSQL, MySQL, MongoDB
- [ ] Embedding generation API endpoint for new skills

**Technical Notes**:
- Model: `intfloat/multilingual-e5-large` or similar
- Batch size: 100 skills/min
- Re-embedding strategy on updates

**Dependencies**: E1-US3

---

**E1-US5: Update Existing Skills Table**
**Story Points**: 8
**Priority**: P0 (Blocker)

**As a** backend developer
**I want** to migrate existing skills records to reference taxonomy codes
**So that** existing user profiles work with new system

**Acceptance Criteria**:
- [ ] Existing `skills.skill_id` mapped to `skills_taxonomy.code`
- [ ] New column `skills.skill_code` populated for all records
- [ ] Backward compatibility: old `skill_id` still works (deprecated)
- [ ] Migration script with rollback plan
- [ ] Data validation: 100% of skills mapped successfully
- [ ] Update API to use `skill_code` going forward

**Technical Notes**:
- Create mapping table: `old_skill_id` → `new_skill_code`
- Gradual migration: deprecate old IDs in v2

**Dependencies**: E1-US3

---

**E1-US6: Skills Taxonomy API Endpoints**
**Story Points**: 8
**Priority**: P0 (Blocker)

**As a** frontend developer
**I want** API endpoints to browse and search skills taxonomy
**So that** I can build skill selection UIs

**Acceptance Criteria**:
- [ ] `GET /api/taxonomy/categories` - List L1 categories
- [ ] `GET /api/taxonomy/categories/:cat_id/subcategories` - List L2
- [ ] `GET /api/taxonomy/skills/search?q=...` - Search skills
- [ ] `GET /api/taxonomy/skills/:code` - Get skill details
- [ ] Response includes i18n names based on Accept-Language header
- [ ] Rate limited (60 req/min)
- [ ] Cached (5 min TTL)

**Technical Notes**:
- Use Next.js API routes
- Cache with Vercel KV or in-memory

**Dependencies**: E1-US3

---

### Epic 2: Project-Skills Linkage & Recency (34 pts)

#### User Stories

**E2-US1: Create Projects Table & API**
**Story Points**: 13
**Priority**: P0 (Blocker)

**As an** individual user
**I want** to create and manage projects (work, volunteer, education, side projects)
**So that** I can track where I've used my skills

**Acceptance Criteria**:
- [ ] `projects` table created via migration
- [ ] API endpoints:
  - `POST /api/projects` - Create project
  - `GET /api/projects` - List user's projects
  - `PATCH /api/projects/:id` - Update project
  - `DELETE /api/projects/:id` - Delete project
- [ ] Project fields: title, type, status, dates, outcomes (JSONB), artifacts
- [ ] Validation: start_date ≤ end_date, outcomes format
- [ ] RLS policies: users can only manage own projects

**Technical Notes**:
- Use Drizzle ORM for type safety
- Status: ongoing | concluded | paused | archived

**Dependencies**: None

---

**E2-US2: Link Skills to Projects**
**Story Points**: 8
**Priority**: P0 (Blocker)

**As an** individual user
**I want** to link multiple skills to each project
**So that** the system knows when I last used each skill

**Acceptance Criteria**:
- [ ] `project_skills` table created
- [ ] API: `POST /api/projects/:id/skills` - Add skill to project
- [ ] API: `DELETE /api/projects/:id/skills/:code` - Remove skill
- [ ] Each skill linkage includes: proficiency_level, usage_frequency, evidence_refs
- [ ] UI: Multi-select skill picker when creating/editing projects
- [ ] Validation: skill_code must exist in taxonomy

**Technical Notes**:
- Unique constraint: (project_id, skill_code)

**Dependencies**: E1 (Skills Taxonomy), E2-US1

---

**E2-US3: Compute Recency Multiplier**
**Story Points**: 8
**Priority**: P1 (High)

**As a** backend developer
**I want** to auto-compute recency_multiplier for each skill based on project dates
**So that** matching can prioritize recent skills

**Acceptance Criteria**:
- [ ] SQL function `compute_skill_recency_multiplier(user_id, skill_code)` implemented
- [ ] Formula: `exp(-α * months_since_last_used)`, α=0.0578 (12-month half-life)
- [ ] Ongoing projects → recency = 1.0 (max)
- [ ] Trigger: auto-update `skills.recency_multiplier` on project changes
- [ ] API: `GET /api/skills/:code/recency` - Check recency for skill
- [ ] Unit tests: verify decay curve

**Technical Notes**:
- Batch job: nightly recalculation for all users (10 min)

**Dependencies**: E2-US2

---

**E2-US4: Compute Impact Score**
**Story Points**: 5
**Priority**: P1 (High)

**As a** backend developer
**I want** to compute impact_score for each skill from project outcomes
**So that** matching can boost high-impact skills

**Acceptance Criteria**:
- [ ] SQL function `compute_skill_impact_score(user_id, skill_code)` implemented
- [ ] Formula: avg(outcome_contribution × project.impact_score)
- [ ] Trigger: auto-update `skills.impact_score` on project outcome changes
- [ ] Validation: impact_score ∈ [0, 1]
- [ ] API: `GET /api/skills/:code/impact` - Check impact

**Technical Notes**:
- Outcomes structure: `{metrics: [{...}], impact_score: 0-1}`

**Dependencies**: E2-US2

---

### Sprint 1 Summary

**Total**: 55 pts (E1) + 34 pts (E2) = **89 pts**
**Timeline**: 2 sprints × 40 pts = 80 pts capacity
**Action**: Prioritize E1 fully + E2-US1, E2-US2 in Sprint 1; E2-US3, E2-US4 in Sprint 2

---

## Phase 2: Core Features (Sprint 3-5)

### Epic 3: Expertise Atlas UI (40 pts)

#### User Stories

**E3-US1: "My Projects" Tab**
**Story Points**: 13
**Priority**: P0 (Blocker)

**As an** individual user
**I want** a dedicated "My Projects" page to manage all my projects
**So that** I can organize my work history and link skills

**Acceptance Criteria**:
- [ ] Route: `/app/i/expertise/projects`
- [ ] List view: cards for all projects (ongoing → concluded → archived)
- [ ] Filter by: type (work, volunteer, education), status, date range
- [ ] Sort by: start_date, end_date, title
- [ ] Create project button → modal form
- [ ] Edit/delete actions per project
- [ ] Empty state: "Add your first project to start building your Expertise Atlas"

**Design Notes**:
- Card shows: title, type badge, dates, skills count, outcomes summary
- Status indicators: green (ongoing), gray (concluded), blue (paused)

**Dependencies**: E2-US1

---

**E3-US2: Project Detail Page with Skills**
**Story Points**: 13
**Priority**: P0 (Blocker)

**As an** individual user
**I want** to view project details and manage linked skills
**So that** I can document my experience comprehensively

**Acceptance Criteria**:
- [ ] Route: `/app/i/expertise/projects/:id`
- [ ] Sections: Overview, Skills, Outcomes, Artifacts, Verification
- [ ] Skills section: add/remove skills, set proficiency (C1-C5), usage frequency
- [ ] Outcomes section: add metrics (name, value, unit), qualitative impact
- [ ] Artifacts section: upload docs (≤5MB), add links
- [ ] Verification section: request verification from stakeholders
- [ ] Breadcrumb navigation: Projects > [Project Title]

**Design Notes**:
- Inline editing for quick updates
- Autosave drafts every 30s

**Dependencies**: E2-US2

---

**E3-US3: Expertise Atlas List View**
**Story Points**: 8
**Priority**: P1 (High)

**As an** individual user
**I want** to see all my skills in a hierarchical list (L1 → L2 → L3 → L4)
**So that** I can understand my skill distribution

**Acceptance Criteria**:
- [ ] Route: `/app/i/expertise`
- [ ] Collapsible tree: L1 categories → L2 → L3 → L4 skills
- [ ] Each skill shows: competency (C1-C5), verification status, recency indicator
- [ ] Sort options: recency, competency, evidence strength, impact
- [ ] Filter: by category, verification status, recency range (< 6mo, 6-12mo, >12mo)
- [ ] Search: type-ahead skill search across all levels
- [ ] CTA: "Add skill" button per L3 category

**Design Notes**:
- Color code recency: green (< 6mo), yellow (6-12mo), red (> 12mo)
- Verified badge: green checkmark

**Dependencies**: E1 (Skills Taxonomy)

---

**E3-US4: Skill Detail Modal**
**Story Points**: 6
**Priority**: P1 (High)

**As an** individual user
**I want** to click on a skill to see detailed info and linked projects
**So that** I can review and add evidence

**Acceptance Criteria**:
- [ ] Modal opens on skill click
- [ ] Sections: Overview, Projects Using This Skill, Evidence, Related Skills
- [ ] Overview: competency, total experience (months), recency, impact score
- [ ] Projects: list all projects using this skill with proficiency
- [ ] Evidence: upload new evidence, link artifacts from projects
- [ ] Related skills: show adjacent skills from graph (with distance)
- [ ] Actions: Request verification, Edit competency, Remove skill

**Design Notes**:
- Slide-in from right (mobile: full screen)

**Dependencies**: E2 (Projects), E3-US3

---

### Epic 4: Skill Adjacency & Graph Matching (30 pts)

#### User Stories

**E4-US1: Build Skill Adjacency Graph**
**Story Points**: 13
**Priority**: P1 (High)

**As a** data engineer
**I want** to auto-generate adjacency relationships from taxonomy hierarchy
**So that** "nearby skills" matching works

**Acceptance Criteria**:
- [ ] Script: generate edges for all (L4_a, L4_b) pairs in same L3 (distance=1)
- [ ] Script: generate edges for pairs in same L2 (distance=2)
- [ ] Script: generate edges for pairs in same L1 (distance=3)
- [ ] `skill_adjacency` table populated with ~50k edges (estimate)
- [ ] Validation: no self-loops, no distance > 3
- [ ] Manual curation: add semantic edges (e.g., "Kubernetes" → "Container Orchestration")

**Technical Notes**:
- Batch job: 10-15 min runtime
- Re-run on taxonomy updates

**Dependencies**: E1-US3 (L4 Skills)

---

**E4-US2: Implement Adjacency Factor Function**
**Story Points**: 5
**Priority**: P0 (Blocker)

**As a** backend developer
**I want** a function to compute adjacency factor between two skill codes
**So that** matching can give partial credit for related skills

**Acceptance Criteria**:
- [ ] SQL function: `skill_adjacency_factor(code1, code2, lambda)` implemented
- [ ] Formula: `exp(-λ * distance)`, default λ=0.7
- [ ] Lookup order: explicit graph edge → taxonomy distance → 0
- [ ] Unit tests: verify decay curve (dist 1 → 0.497, dist 2 → 0.247, dist 3 → 0.123)
- [ ] TypeScript equivalent function for client-side preview

**Technical Notes**:
- Cache results (LRU, 10k entries)

**Dependencies**: E4-US1

---

**E4-US3: Integrate Adjacency into Matching**
**Story Points**: 8
**Priority**: P0 (Blocker)

**As a** backend developer
**I want** to update the matching algorithm to use adjacency factor
**So that** candidates with related skills get partial credit

**Acceptance Criteria**:
- [ ] Update `computeSkillScore()` function:
  - For each required skill, find best match in candidate skills (exact or adjacent)
  - Apply adjacency factor × level fit × recency × evidence × impact
- [ ] Test: job requires "Container Orchestration", candidate has "Kubernetes" → score ~0.4-0.5
- [ ] Test: job requires "PostgreSQL", candidate has "MySQL" → score ~0.25-0.35
- [ ] Explanation includes adjacency info: "Kubernetes (adjacent to Container Orchestration)"
- [ ] Performance: matching 500 candidates takes < 2s

**Technical Notes**:
- Preload adjacency graph into memory on server start
- Cache candidate × assignment adjacency results

**Dependencies**: E4-US2, Existing matching system

---

**E4-US4: Admin UI for Graph Curation**
**Story Points**: 4
**Priority**: P2 (Nice to Have)

**As a** content admin
**I want** a UI to add/edit adjacency relationships
**So that** I can improve matching quality

**Acceptance Criteria**:
- [ ] Route: `/admin/taxonomy/adjacency` (admin only)
- [ ] Search skills and create edges
- [ ] Set relation_type (is_a, related_to, prerequisite_of) and distance
- [ ] Edit strength (0-1 override)
- [ ] Preview: "If candidate has X and job requires Y, adj factor = Z"
- [ ] Audit log: who added/edited which edges

**Dependencies**: E4-US1

---

### Sprint 3-4 Summary

**Sprint 3**: E3-US1 (13), E3-US2 (13), E3-US3 (8) = **34 pts**
**Sprint 4**: E3-US4 (6), E4 (30 pts) = **36 pts**

---

## Phase 3: Advanced Matching (Sprint 5-7)

### Epic 5: Assignment Creation Workflow (45 pts)

#### User Stories

**E5-US1: Define Pipeline Templates**
**Story Points**: 5
**Priority**: P1 (High)

**As an** organization admin
**I want** to define a custom pipeline for assignment creation
**So that** different stakeholders can contribute their expertise

**Acceptance Criteria**:
- [ ] UI: `/app/o/[slug]/settings/pipelines/new`
- [ ] Define steps: name, stakeholder_role, required/optional
- [ ] Predefined templates: "HR → Tech Lead → CEO", "Simple (no pipeline)", "Extended (+ Legal)"
- [ ] Save pipeline as org default
- [ ] Apply pipeline to specific assignment types

**Technical Notes**:
- Store in `assignment_creation_pipeline_templates` table

**Dependencies**: None

---

**E5-US2: Assignment Creation with Pipeline**
**Story Points**: 13
**Priority**: P0 (Blocker)

**As an** organization member
**I want** to create an assignment that goes through a multi-step pipeline
**So that** all stakeholders can define requirements

**Acceptance Criteria**:
- [ ] Route: `/app/o/[slug]/assignments/new`
- [ ] Step 1: Select pipeline template (or "no pipeline")
- [ ] Step 2: Basic info (title, role, description, dates)
- [ ] Step 3: Business value & outcomes (if pipeline has this step)
- [ ] Assignment status: `draft` → `pipeline_in_progress` (auto)
- [ ] Email notification sent to first stakeholder
- [ ] Dashboard shows "Assignments awaiting your input"

**Technical Notes**:
- Auto-create pipeline steps on assignment insert (trigger)

**Dependencies**: E5-US1

---

**E5-US3: Stakeholder Step Completion**
**Story Points**: 13
**Priority**: P0 (Blocker)

**As a** stakeholder (HR, Tech Lead, CEO)
**I want** to complete my step in the assignment pipeline
**So that** I can contribute my requirements

**Acceptance Criteria**:
- [ ] Route: `/app/o/[slug]/assignments/:id/pipeline/:step_id`
- [ ] Form customized per stakeholder_role:
  - HR: values, causes, work style, team culture
  - Tech Lead: required/nice-to-have skills (multi-select from taxonomy), link to outcomes
  - CEO: strategic notes, growth opportunities
- [ ] Save as draft (auto-save every 30s)
- [ ] Mark step as complete → notify next stakeholder
- [ ] Reject step → send back to previous stakeholder with notes

**Technical Notes**:
- Store in `step_data` JSONB field

**Dependencies**: E5-US2

---

**E5-US4: Expertise Matrix UI**
**Story Points**: 8
**Priority**: P0 (Blocker)

**As a** Tech Lead
**I want** to add skills to the assignment and link them to outcomes
**So that** the matching algorithm knows what's required

**Acceptance Criteria**:
- [ ] Skill selector: type-ahead search taxonomy (shows L1 > L2 > L3 > L4)
- [ ] For each skill: set min_level (C1-C5), weight (0.5-2.0), required/nice-to-have
- [ ] Link to outcome: dropdown of assignment outcomes, add rationale text
- [ ] Provide examples: "Build responsive dashboards, integrate APIs"
- [ ] Preview: "This skill will contribute ~X% to match score"

**Technical Notes**:
- Validate: sum of weights should be reasonable (warn if too skewed)

**Dependencies**: E5-US3, E1 (Taxonomy)

---

**E5-US5: Final Review & Publish**
**Story Points**: 6
**Priority**: P0 (Blocker)

**As an** organization admin
**I want** to review the completed assignment and publish it
**So that** matching can begin

**Acceptance Criteria**:
- [ ] Route: `/app/o/[slug]/assignments/:id/review`
- [ ] Show all collected data: business value, outcomes, skills, values, practicals
- [ ] Edit any section if needed
- [ ] Approve → status: `ready_to_publish`
- [ ] Publish button → status: `published`, assignment.status = `active`
- [ ] Fire analytics event: `assignment_published`
- [ ] Trigger matching job within 24h

**Technical Notes**:
- Auto-transition to `pending_review` when all steps completed (trigger)

**Dependencies**: E5-US3, E5-US4

---

### Epic 6: Practical Fit Enhancements (38 pts)

#### User Stories

**E6-US1: Benefits Taxonomy & Preferences**
**Story Points**: 13
**Priority**: P1 (High)

**As an** individual user
**I want** to specify which benefits are important to me
**So that** matching considers benefits fit

**Acceptance Criteria**:
- [ ] Route: `/app/i/profile/edit#benefits`
- [ ] Benefits selector: categorized list (insurance, equity, transport, wellness, learning, time_off, financial, family)
- [ ] For each benefit: set importance (required, preferred, nice_to_have, not_important)
- [ ] Save to `profile_benefits_prefs` table
- [ ] Org side: `/app/o/[slug]/assignments/:id/edit#benefits` - select offered benefits

**Technical Notes**:
- Seed 24 common benefits (already in migration)

**Dependencies**: None

---

**E6-US2: Availability Bitmap UI**
**Story Points**: 13
**Priority**: P1 (High)

**As an** individual user
**I want** to specify my weekly availability in a visual grid
**So that** matching considers schedule compatibility

**Acceptance Criteria**:
- [ ] Route: `/app/i/profile/edit#availability`
- [ ] 7×24 grid (half-hour slots): Mon-Sun, 00:00-23:30
- [ ] Click/drag to toggle available hours
- [ ] Templates: "Mon-Fri 9-5", "Evenings & Weekends", "Flexible"
- [ ] Convert to 336-bit bitmap, store in `matching_profiles.availability_bitmap`
- [ ] Org side: similar UI for required availability

**Technical Notes**:
- Use canvas or SVG for performance with 336 cells

**Dependencies**: None

---

**E6-US3: Work Authorization Fields**
**Story Points**: 5
**Priority**: P1 (High)

**As an** individual user
**I want** to specify my work authorization status and sponsorship needs
**So that** I'm only matched with compatible roles

**Acceptance Criteria**:
- [ ] Route: `/app/i/profile/edit#work-auth`
- [ ] Fields:
  - Do you need visa sponsorship? (yes/no)
  - Would you like sponsorship if available? (yes/no)
  - Work authorization: type (citizen, PR, work permit, student visa), countries, expiry
- [ ] Org side: Can sponsor visas? (yes/no), Countries available
- [ ] Hard gate: if needs_sponsorship=true and can_sponsor=false → reject match

**Technical Notes**:
- Store in `matching_profiles.work_authorization` JSONB

**Dependencies**: None

---

**E6-US4: Currency Normalization**
**Story Points**: 7
**Priority**: P1 (High)

**As a** backend developer
**I want** to normalize all compensation to USD for comparison
**So that** cross-currency matching works correctly

**Acceptance Criteria**:
- [ ] `currency_exchange_rates` table seeded with common currencies
- [ ] API: `POST /admin/currency-rates` - Update rates (admin only)
- [ ] Scheduled job: fetch rates from ECB/OpenExchange API daily
- [ ] SQL function: `normalize_compensation_to_usd(amount, currency)` implemented
- [ ] Update matching algorithm to use normalized values
- [ ] Test: $55k USD vs €50k EUR → correctly compares

**Technical Notes**:
- Free API: European Central Bank (ECB) or OpenExchangeRates

**Dependencies**: None

---

### Sprint 5-7 Summary

**Sprint 5**: E5-US1 (5), E5-US2 (13), E5-US3 (13) = **31 pts**
**Sprint 6**: E5-US4 (8), E5-US5 (6), E6-US1 (13), E6-US2 (13) = **40 pts**
**Sprint 7**: E6-US3 (5), E6-US4 (7), E7 (Match Explainability) = **12 + 28 = 40 pts**

---

## Phase 4: Polish & Launch (Sprint 8-10)

### Epic 7: Match Explainability (28 pts)

#### User Stories

**E7-US1: Explanation API Endpoint**
**Story Points**: 8
**Priority**: P0 (Blocker)

**As a** backend developer
**I want** an API to generate match explanations
**So that** users can see why they matched

**Acceptance Criteria**:
- [ ] API: `GET /api/matches/:match_id/explain`
- [ ] Response structure: score, components (skills, mvv, practical), explain array, suggestions array
- [ ] Explain includes: type, weight, detail, matched_skills, shared_values, etc.
- [ ] Cached (5 min TTL) to avoid recomputation
- [ ] Rate limited (10 req/min per user)

**Technical Notes**:
- Reuse scoring functions, add metadata collection

**Dependencies**: Existing matching system, E4 (Adjacency)

---

**E7-US2: Improvement Suggestions Calculator**
**Story Points**: 13
**Priority**: P1 (High)

**As a** backend developer
**I want** to calculate improvement suggestions with numeric deltas
**So that** users know exactly how to improve their match

**Acceptance Criteria**:
- [ ] Analyze missing required skills → estimate impact
- [ ] Analyze low evidence_strength → estimate proof boost
- [ ] Analyze missing values/causes → estimate MVV boost
- [ ] Formula: `delta_score = (new_component - old_component) * weight * 100`
- [ ] Return top 5 suggestions sorted by impact
- [ ] Include action URLs (e.g., `/app/i/expertise?add=01.02.15.047`)

**Technical Notes**:
- Conservative estimates (80th percentile impact)

**Dependencies**: E7-US1

---

**E7-US3: Match Explanation UI**
**Story Points**: 7
**Priority**: P0 (Blocker)

**As an** individual user
**I want** to see "Why this match?" with clear breakdowns
**So that** I understand the algorithm and trust the results

**Acceptance Criteria**:
- [ ] Expandable "Why this match?" section on match card
- [ ] Three tabs: Skills, Mission & Values, Practical Fit
- [ ] Skills tab: table of required skills, candidate proficiency, match status (✅/🟡/❌)
- [ ] MVV tab: mission similarity %, shared values tags, shared causes tags
- [ ] Practical tab: comp match, availability overlap %, location distance, visa status
- [ ] Improvement suggestions: numbered list with estimated impact (+X points)
- [ ] CTA buttons: [Add Skill], [Add Proof], [Update Profile]

**Design Notes**:
- Use accordion for explanation details
- Color code: green (strong), yellow (partial), red (missing)

**Dependencies**: E7-US2

---

### Epic 8: Sensitive Field Visibility (20 pts)

#### User Stories

**E8-US1: Field Visibility Settings**
**Story Points**: 8
**Priority**: P1 (High)

**As an** organization admin
**I want** to control which assignment fields are visible to candidates
**So that** sensitive info is hidden but used in matching

**Acceptance Criteria**:
- [ ] Route: `/app/o/[slug]/assignments/:id/edit#visibility`
- [ ] List all assignment fields with visibility toggles
- [ ] Options: Public, Post-Match, Hidden (used in matching), Internal Only
- [ ] For hidden fields: set generic label (e.g., "Competitive salary")
- [ ] Auto-populated defaults on assignment creation
- [ ] Save to `assignment_field_visibility` table

**Technical Notes**:
- Defaults already seeded in migration

**Dependencies**: None

---

**E8-US2: Redaction in Match Display**
**Story Points**: 8
**Priority**: P1 (High)

**As a** backend developer
**I want** to redact sensitive fields based on visibility rules
**So that** candidates don't see hidden info

**Acceptance Criteria**:
- [ ] Function: `getVisibleFields(assignment_id, candidate_id, stage)` implemented
- [ ] Check visibility level vs match status (mutual_interest, conversation_started)
- [ ] Apply redaction: hide, mask, or replace with generic label
- [ ] Update match API to use redacted data
- [ ] Audit log: record field access attempts

**Technical Notes**:
- Cache visibility rules (1 hour TTL)

**Dependencies**: E8-US1

---

**E8-US3: Staged Reveal**
**Story Points**: 4
**Priority**: P2 (Nice to Have)

**As an** organization admin
**I want** certain fields to reveal after mutual interest or conversation start
**So that** info is progressively disclosed

**Acceptance Criteria**:
- [ ] Update `getVisibleFields()` to check conversation stage
- [ ] Test: comp_min hidden initially, visible after mutual interest
- [ ] Test: hiring_manager_notes always internal_only
- [ ] System message in conversation: "New info available: [Salary Range]"

**Dependencies**: E8-US2, Messaging system

---

### Epic 9: Testing & QA (30 pts)

#### User Stories

**E9-US1: Unit Tests for Core Functions**
**Story Points**: 13
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] Test skill_adjacency_factor() with all distance values
- [ ] Test compute_skill_recency_multiplier() with various dates
- [ ] Test compensation_score() with currency normalization
- [ ] Test availability_overlap() with bitmaps
- [ ] Test matching algorithm with synthetic profiles
- [ ] 80%+ code coverage for new features

**Dependencies**: All epics

---

**E9-US2: Integration Tests**
**Story Points**: 8
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] Test full assignment creation pipeline (draft → pipeline → publish)
- [ ] Test project creation → skill linkage → recency update
- [ ] Test matching with adjacency (job requires X, candidate has Y)
- [ ] Test explanation generation for 10 synthetic matches

**Dependencies**: E9-US1

---

**E9-US3: User Acceptance Testing (UAT)**
**Story Points**: 9
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] 5 beta users create profiles with Expertise Atlas
- [ ] 2 orgs create assignments with pipelines
- [ ] Run matching, collect feedback on explainability
- [ ] Verify accuracy of improvement suggestions (manual check)
- [ ] Fix P0/P1 bugs found in UAT

**Dependencies**: All epics

---

### Epic 10: Documentation & Deployment (20 pts)

#### User Stories

**E10-US1: User Documentation**
**Story Points**: 8
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] Guide: "Creating Your Expertise Atlas"
- [ ] Guide: "Linking Skills to Projects"
- [ ] Guide: "Understanding Match Scores"
- [ ] Guide: "Assignment Creation Pipelines (for Orgs)"
- [ ] FAQ: "Why is my match score X?", "How to improve my profile?"
- [ ] Publish to `/docs` or Notion

**Dependencies**: None

---

**E10-US2: Deployment Plan**
**Story Points**: 5
**Priority**: P0 (Blocker)

**Acceptance Criteria**:
- [ ] Run all 4 migrations in staging
- [ ] Verify data integrity (no broken FKs, no null violations)
- [ ] Run seed scripts (taxonomy, benefits, currency rates)
- [ ] Deploy to production (off-hours, Sun 02:00 CET)
- [ ] Monitor for 24h post-deploy (error rates, latency)
- [ ] Rollback plan documented

**Technical Notes**:
- Migrations: 10-15 min total runtime (estimate)

**Dependencies**: E9 (Testing)

---

**E10-US3: Performance Optimization**
**Story Points**: 7
**Priority**: P1 (High)

**Acceptance Criteria**:
- [ ] Matching 500 candidates < 2s (P95)
- [ ] Adjacency graph lookup < 5ms
- [ ] Explanation generation < 100ms
- [ ] Index coverage: 95%+ queries use indexes
- [ ] Cache hit rate: > 80% for taxonomy/adjacency

**Technical Notes**:
- Use EXPLAIN ANALYZE to identify slow queries
- Add missing indexes

**Dependencies**: E9-US2

---

### Sprint 8-10 Summary

**Sprint 8**: E8 (20 pts) + partial E7 (15 pts) = **35 pts**
**Sprint 9**: E9 (30 pts) + E7-US3 (7 pts) = **37 pts**
**Sprint 10**: E10 (20 pts) + buffer = **20 pts**

---

## Story Point Reference

| Points | Complexity | Time Estimate | Example |
|--------|------------|---------------|---------|
| **1** | Trivial | < 1 hour | Copy change, config update |
| **2** | Simple | 2-4 hours | Basic CRUD endpoint |
| **3** | Easy | 4-6 hours | Simple UI component |
| **5** | Moderate | 1-1.5 days | API endpoint with validation |
| **8** | Complex | 2-3 days | Feature with DB + API + UI |
| **13** | Very Complex | 3-5 days | Multi-layered feature |
| **21** | Huge | 1-2 weeks | Epic-sized, should be split |

**Fibonacci Sequence**: 1, 2, 3, 5, 8, 13, 21

---

## Dependencies Map

```
E1 (Taxonomy) ──┬──> E2 (Projects) ──┬──> E3 (Expertise Atlas UI)
                │                     │
                └──> E4 (Adjacency) ──┴──> E7 (Explainability)
                          │
                          └──> Matching Integration

E5 (Assignment Workflow) ──> E8 (Sensitive Fields)

E6 (Practical Fit) ──> Matching Integration

All ──> E9 (Testing) ──> E10 (Deployment)
```

**Critical Path**: E1 → E2 → E4 → Matching → E7 → E9 → E10 (7-8 sprints minimum)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Taxonomy data creation slow** | Medium | High | Start with 1k skills (MVP), expand iteratively |
| **Adjacency graph performance** | Low | High | Preload into memory, cache aggressively |
| **Matching latency > 2s** | Medium | Medium | Profile queries, add indexes, use ANN for embeddings |
| **User confusion with Expertise Atlas** | High | Medium | Extensive UX testing, onboarding tooltips |
| **Pipeline workflow too complex** | Medium | Medium | Offer "Simple" template (no pipeline) as default |

---

## Release Criteria

**Minimum for Beta Launch**:
- [x] E1: Skills Taxonomy System (1000+ skills)
- [x] E2: Project-Skills Linkage (full)
- [x] E3: Expertise Atlas UI (core views)
- [x] E4: Adjacency Matching (basic)
- [ ] E5: Assignment Workflow (optional: can use "no pipeline" mode)
- [ ] E6: Practical Fit (at least benefits + work auth)
- [x] E7: Explainability (API + basic UI)
- [ ] E9: Testing (UAT passed)
- [ ] E10: Deployment (migrations applied)

**Recommended for GA**:
- All epics complete
- 10,000+ skills in taxonomy
- Curated adjacency graph (500+ semantic edges)
- Performance targets met (2s matching, 100ms explanations)

---

**End of Backlog**

**Next Steps**:
1. Review and prioritize with product team
2. Assign stories to sprints in project management tool (Jira/Linear)
3. Begin Sprint 1 planning meeting
4. Kick off E1-US1: Design L1 Categories

**Questions? Contact:** Engineering Lead or Product Manager
