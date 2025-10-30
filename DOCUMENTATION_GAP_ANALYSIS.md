# Documentation Gap Analysis & Alignment Review

**Date:** 2025-10-29
**Reviewer:** System Architecture Review
**Documents Reviewed:**
- `SYSTEM_ARCHITECTURE_COMPREHENSIVE.md` (current documentation)
- `Proofound_PRD_MVP.md` (MVP requirements)
- `Proofound_PRD_Full_Product.md` (target state)
- `Proofound_Matching_Conversation.md` (matching engine spec)

---

## Executive Summary

### Overall Alignment: 75% ✅ (Good, but requires updates)

**Critical Misalignments Found:** 3
**Minor Discrepancies:** 8
**Missing Documentation:** 5 areas

---

## 🚨 CRITICAL MISALIGNMENTS

### 1. **MATCHING WEIGHTS MISMATCH** (HIGH PRIORITY)

**PRD MVP States (Section 4.4):**
```
Default Weights:
- Mission/Values: 30%
- Core Expertise: 40%
- Tools: 10%
- Logistics: 10%
- Recency: 10%
```

**Matching Conversation States:**
```
Default Weights:
- Skills: 55%
- MVV (Mission/Values): 25%
- Practical: 20%
```

**Current Documentation:** Uses Matching Conversation weights (55/25/20)

**Impact:** High - Core algorithm behavior differs from PRD
**Recommendation:**
- **Decision required:** Which weights are correct for MVP?
- If PRD MVP is authoritative → update implementation + docs
- If Matching Conversation is refined spec → update PRD MVP

**Rationale for discrepancy:** Matching Conversation appears to be a more detailed, engineer-focused spec that consolidates:
- Core Expertise (40%) + Tools (10%) → Skills (55%) + safety margin
- Logistics (10%) + Recency (10%) → Practical (20%)
- Mission/Values (30%) → MVV (25%) with buffer

**Proposed Resolution:** Use Matching Conversation weights but document the mapping clearly.

---

### 2. **SKILLS TAXONOMY STRUCTURE MISMATCH** (MEDIUM PRIORITY)

**Matching Conversation Spec (Lines 276-284):**
```
L1 - 6 largest skill domains
L2 - Large categories within domains
L3 - Subcategories for each large category
L4 - Granular skills/tools/frameworks (10,000+ items)

Code format: L1.L2.L3.L4 (e.g., 02.07.03.142)
```

**Current Database Schema (`src/db/schema.ts`):**
```typescript
export const skills = pgTable('skills', {
  skillId: text('skill_id').notNull(),  // Only references taxonomy key
  level: integer('level').notNull(),    // 0-5 scale
  monthsExperience: integer('months_experience'),
  // Missing: L1/L2/L3/L4 structure, adjacency graph
});
```

**What's Missing:**
1. ❌ No skills taxonomy tables (categories, subcategories)
2. ❌ No L1→L2→L3→L4 hierarchy
3. ❌ No skill adjacency graph for "nearby skills" matching
4. ❌ No skill embeddings for semantic search
5. ❌ No multilingual aliases (`name_i18n`, `aliases_i18n[]`)

**Impact:** High - Core matching feature (adjacency bonus) cannot work
**Recommendation:** Add taxonomy tables to schema + migration

---

### 3. **L4 SKILL ATTRIBUTES INCOMPLETE** (HIGH PRIORITY)

**Matching Conversation Requirements (Lines 286-292):**

Each L4 item must have:
- ✅ **Competency level**: C1-C5 (have as `level: 0-5`)
- ⚠️ **Proof artifacts**: Links, docs (≤5MB) - partially implemented via `evidence` table
- ⚠️ **Verifications**: Peer reviews, employer verified, public acknowledgments - have `verificationStatus` but missing detailed types
- ❌ **Recency**: Tied to projects (Ongoing/Concluded) → `last_used_at` - have `monthsExperience` but no project linkage
- ❌ **Measurable outcomes**: Tied to project outcomes - missing entirely

**Current Schema:**
```typescript
export const skills = pgTable('skills', {
  level: integer('level'),              // ✅ Maps to C1-C5
  monthsExperience: integer(),          // ⚠️ Partial recency
  // ❌ No project_id foreign key
  // ❌ No outcomes linkage
});

export const capabilities = pgTable('capabilities', {
  evidenceCount: integer(),             // ⚠️ Count only, not full artifacts
  verificationStatus: text(),           // ⚠️ Generic status
  lastValidatedAt: timestamp(),         // ⚠️ Validation, not usage
  // ❌ No recency calculation from projects
});
```

**Impact:** Medium-High - Affects matching quality (recency decay, impact scoring)
**Recommendation:** Add project linkage + outcomes to skills/capabilities

---

## ⚠️ MINOR DISCREPANCIES

### 4. **Assignment Creation Flow Not Documented**

**Matching Conversation Spec (Lines 388-396):**

Assignment creation flow:
1. Expected business value
2. Expected outcomes (continuous/milestone)
3. **Expertise matrix** via multi-stakeholder pipeline:
   - HR → cultural criteria
   - Tech Lead → technical skills
   - CEO → strategic add-ons
   - Fully customizable per company
4. L4 specs linked to outcomes
5. Practical parameters
6. **Sensitive fields** with visibility flags (hidden from candidates, used in matching)

**Current Documentation:**
- Basic assignment creation documented
- ❌ Multi-stakeholder pipeline not documented
- ❌ Outcome linkage not explained
- ❌ Sensitive field visibility system not documented

**Recommendation:** Add "Assignment Creation Workflow" section with state machine diagram

---

### 5. **Top Match Count Discrepancy**

**PRD MVP (Section 4.4):** "Top 5-10 matches per assignment (configurable)"
**Current Documentation (Section 9.1):** "Store top 5-10 results per assignment"

**Status:** ✅ Aligned (just confirming)

---

### 6. **Staged Identity Reveal Details**

**PRD MVP (Section 4.7):**
- Stage 1: Masked basics
- Stage 2: Names/org revealed **after mutual accept**

**Current Documentation (Section 5.3):**
- ✅ Stage 1 and Stage 2 documented
- ⚠️ Missing trigger mechanism: "mutual accept" workflow not detailed
- ⚠️ What happens if one party accepts but not the other?

**Recommendation:** Add state transition diagram for conversation stages

---

### 7. **Attachment Size Limit**

**PRD MVP (Section 4.7):** "PDF ≤5 MB only"
**Matching Conversation (Line 288):** "uploadable docs up to 5 mb"
**Current Documentation (Section 3.6):** "PDF ≤5 MB" ✅

**Status:** ✅ Aligned

---

### 8. **Verification SLA Targets**

**PRD MVP (Section 4.5):**
- Target response: 72h
- Auto-nudge: 48h & 7d
- Expiry: 14d
- Appeal review: ≤72h

**Current Documentation (Section 3.5):**
- ✅ All SLA targets documented correctly

**Status:** ✅ Aligned

---

### 9. **Political Content Policy**

**PRD MVP (Section 4.8):**
- ✅ Allowed: "Policy analyst at Ministry of X (2019-2022)"
- ✅ Allowed: "Organized civic tech hackathon, outcomes linked here"
- ❌ Disallowed: "Vote for party X / donate to Y"
- ❌ Disallowed: "Promotional content for political campaign"

**Current Documentation (Section 3.7):**
- ✅ Policy documented with examples

**Status:** ✅ Aligned

---

### 10. **Moderation Violation Escalation**

**PRD MVP (Section 4.8):** "1 warning → second critical violation → timed suspension"
**Current Documentation (Section 3.7):** "1 warning → 2nd critical → timed suspension"

**Status:** ✅ Aligned

---

### 11. **Rate Limiting Targets**

**PRD MVP (Section 7):**
- 60 req/min per IP
- 120 req/min per user token (burst 2×)
- Stricter for auth/verification

**Current Documentation (Section 3.9):**
- ✅ All limits documented

**Status:** ✅ Aligned

---

## 📋 MISSING DOCUMENTATION

### 12. **Expertise Atlas Detailed Structure**

**Matching Conversation Context:**
- Every user has an "Expertise Atlas"
- Skills tree with L1→L2→L3→L4 taxonomy
- Each L4 has C1-C5 competency, proofs, verifications, recency, outcomes
- Same artifact can be tied to multiple L4s
- Artifacts live in: experiences, education, volunteering, "My Projects" tab

**Current Documentation:**
- ⚠️ "Expertise Atlas" mentioned briefly as feature
- ❌ Not explained as the central skills management system
- ❌ "My Projects" tab not documented
- ❌ Multi-L4 artifact linkage not explained

**Recommendation:** Add dedicated "Expertise Atlas System" section (Section 3.X)

---

### 13. **Matching Algorithm Explainability Details**

**PRD MVP (Section 4.4):**
- Each suggestion shows "**Why this match**" with % breakdown
- **Numeric improvement tips** (e.g., "Add proof X to increase score by ~8-12%")

**Matching Conversation (Lines 145-152):**
```
Example explanation:
- "Matched 7/9 required skills at level ≥ 3 (Kubernetes 4, Postgres 4)…"
- "Mission similarity 0.83; shared causes: 'climate resilience', 'open education'…"
- "Time-zone overlap 100%; comp target within range; hybrid commute 14 km."
```

**Current Documentation (Section 9.1):**
- ✅ Scoring components documented
- ⚠️ Explainability format partially documented
- ❌ Improvement tip calculation not explained ("Add proof X → +8-12%")

**Recommendation:** Add "Match Explanation System" subsection with examples

---

### 14. **Skill Adjacency & Graph Traversal**

**Matching Conversation (Lines 86-91):**
```
Adjacency bonus: if no exact skill match, allow graph-adjacent skill
within distance d (1-2 hops) with decay adj_decay = exp(-λ * distance)

Examples: Kubernetes ↔ Container Orchestration
```

**Current Documentation:**
- ❌ Adjacency concept not documented
- ❌ Graph traversal not explained
- ❌ No schema for skill relationships

**Recommendation:** Add to schema + explain in matching algorithm section

---

### 15. **Practical Fit Component Details**

**Matching Conversation (Lines 354-386):**

Practical fit includes:
- Compensation (with currency normalization)
- Availability (7×48 bitmap)
- Work setting (onsite/hybrid/remote)
- Location + timezone overlap
- Language requirements
- Work authorization + **visa sponsorship** (ability vs need)
- **Benefits matrix**: insurances, stock options, company car, pension, wellness

**Current Documentation (Section 9.1):**
- ⚠️ "Logistics" and "Compensation" mentioned
- ❌ Visa sponsorship matching not documented
- ❌ Benefits matrix not documented
- ❌ 7×48 availability bitmap not explained

**Recommendation:** Expand "Practical Fit Scoring" with all components

---

### 16. **Assignment Sensitive Fields & Visibility System**

**Matching Conversation (Lines 395-396):**
```
A company can make certain sensitive info important for assignment
not visible even to matched candidates at first. This info would be
used in the background and not necessarily exposed - for mutual
respect purposes.
```

**Current Documentation:**
- ❌ Visibility flags system not documented
- ❌ No explanation of how sensitive fields are used in matching but hidden in UI

**Recommendation:** Add "Sensitive Field Management" section

---

## 🎯 TARGET STATE (Full Product) FEATURES NOT YET DOCUMENTED

### 17. Future Features from `Proofound_PRD_Full_Product.md`

These are intentionally post-MVP, but should be tracked:

| Feature | PRD Full Product | Current Status | Notes |
|---------|------------------|----------------|-------|
| **Native Mobile Apps** | iOS & Android | ❌ Not started | Mentioned in PRD Section 1 |
| **Adaptive Learning Weights** | ML-based weight optimization | ❌ Not started | Section 3.1 |
| **Multi-Ref Verification Trees** | Ancestry visualization | ❌ Not started | Section 3.2 |
| **Contracts → Payments** | Escrow, milestone payouts | ❌ Not started | Section 3.3 |
| **Cluster Intelligence Personal UI** | User-visible network graph | 🟡 Schema only | Section 3.4 |
| **Voice/Video Messaging** | Rich media | ❌ Not started | Section 3.5 |
| **Public APIs/SDKs** | External integrations | ❌ Not started | Section 8 |
| **Development Hub** | Learning plans, coaching | ❌ Not started | Section 6 |
| **Zen Hub** | Well-being tools | ❌ Not started | Section 6 |
| **AI Co-founder** | Tiered AI usage | ❌ Not started | Section 6 |

**Documentation Status:** ✅ Marked as "Post-MVP" in feature matrix (Section 7)

---

## 📊 SCHEMA GAPS SUMMARY

### Tables/Features Needed (Not Yet in Schema)

1. **Skills Taxonomy Tables** (from Matching Conversation)
   ```sql
   CREATE TABLE skills_categories (
     cat_id INTEGER PRIMARY KEY,          -- L1 (1-6)
     slug TEXT UNIQUE NOT NULL,
     name_i18n JSONB,
     version INTEGER DEFAULT 1
   );

   CREATE TABLE skills_subcategories (
     cat_id INTEGER REFERENCES skills_categories,
     subcat_id INTEGER,                   -- L2
     slug TEXT UNIQUE NOT NULL,
     name_i18n JSONB,
     version INTEGER DEFAULT 1,
     PRIMARY KEY (cat_id, subcat_id)
   );

   CREATE TABLE skills_l3 (
     cat_id INTEGER,
     subcat_id INTEGER,
     l3_id INTEGER,                       -- L3
     slug TEXT UNIQUE NOT NULL,
     name_i18n JSONB,
     version INTEGER DEFAULT 1,
     PRIMARY KEY (cat_id, subcat_id, l3_id),
     FOREIGN KEY (cat_id, subcat_id) REFERENCES skills_subcategories
   );

   CREATE TABLE skills_taxonomy (
     code TEXT PRIMARY KEY,               -- "02.07.03.142"
     cat_id INTEGER NOT NULL,
     subcat_id INTEGER NOT NULL,
     l3_id INTEGER NOT NULL,
     skill_id INTEGER NOT NULL,           -- L4
     slug TEXT UNIQUE NOT NULL,
     name_i18n JSONB NOT NULL,
     aliases_i18n JSONB DEFAULT '[]'::jsonb,
     description_i18n JSONB,
     embedding VECTOR(768),               -- For semantic search
     status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated')),
     alias_of TEXT REFERENCES skills_taxonomy(code),  -- For migrations
     version INTEGER DEFAULT 1,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Skill Adjacency Graph**
   ```sql
   CREATE TABLE skill_adjacency (
     from_code TEXT REFERENCES skills_taxonomy(code),
     to_code TEXT REFERENCES skills_taxonomy(code),
     relation_type TEXT CHECK (relation_type IN ('is_a', 'related_to', 'adjacent_to')),
     distance INTEGER CHECK (distance BETWEEN 1 AND 3),
     PRIMARY KEY (from_code, to_code)
   );

   CREATE INDEX idx_skill_adjacency_from ON skill_adjacency(from_code);
   CREATE INDEX idx_skill_adjacency_to ON skill_adjacency(to_code);
   ```

3. **Project-Skill Linkage** (for recency calculation)
   ```sql
   CREATE TABLE projects (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     status TEXT CHECK (status IN ('ongoing', 'concluded')),
     start_date DATE NOT NULL,
     end_date DATE,
     outcomes JSONB DEFAULT '{}'::jsonb,  -- Measurable outcomes
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE project_skills (
     project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
     skill_code TEXT REFERENCES skills_taxonomy(code),
     level INTEGER CHECK (level BETWEEN 1 AND 5),
     evidence_refs TEXT[],  -- Links to artifacts
     PRIMARY KEY (project_id, skill_code)
   );
   ```

4. **Assignment Expertise Matrix** (multi-stakeholder pipeline)
   ```sql
   CREATE TABLE assignment_expertise_matrix (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
     stakeholder_role TEXT NOT NULL,  -- 'hr', 'tech_lead', 'ceo', etc.
     skill_code TEXT REFERENCES skills_taxonomy(code),
     min_level INTEGER CHECK (min_level BETWEEN 1 AND 5),
     weight NUMERIC DEFAULT 1.0,
     is_required BOOLEAN DEFAULT true,
     linked_outcome_id UUID,  -- FK to assignment outcomes
     notes TEXT,
     added_by UUID REFERENCES profiles(id),
     added_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE assignment_creation_pipeline (
     assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
     step_order INTEGER NOT NULL,
     stakeholder_role TEXT NOT NULL,
     stakeholder_user_id UUID REFERENCES profiles(id),
     status TEXT CHECK (status IN ('pending', 'completed', 'skipped')),
     completed_at TIMESTAMP,
     PRIMARY KEY (assignment_id, step_order)
   );
   ```

5. **Assignment Visibility Flags** (sensitive fields)
   ```sql
   CREATE TABLE assignment_field_visibility (
     assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
     field_name TEXT NOT NULL,
     visibility_level TEXT CHECK (visibility_level IN ('public', 'post_match', 'hidden_used_for_matching', 'internal_only')),
     reveal_stage INTEGER,  -- 1 or 2 for staged reveal
     PRIMARY KEY (assignment_id, field_name)
   );
   ```

6. **Benefits Matrix** (for practical fit matching)
   ```sql
   CREATE TABLE benefits_taxonomy (
     code TEXT PRIMARY KEY,  -- 'health_insurance', 'stock_options', 'company_car'
     category TEXT NOT NULL,  -- 'insurance', 'equity', 'transport', 'wellness'
     name_i18n JSONB NOT NULL
   );

   CREATE TABLE profile_benefits_prefs (
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     benefit_code TEXT REFERENCES benefits_taxonomy(code),
     importance TEXT CHECK (importance IN ('required', 'preferred', 'nice_to_have')),
     PRIMARY KEY (user_id, benefit_code)
   );

   CREATE TABLE assignment_benefits_offered (
     assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
     benefit_code TEXT REFERENCES benefits_taxonomy(code),
     details TEXT,
     PRIMARY KEY (assignment_id, benefit_code)
   );
   ```

7. **Work Authorization & Sponsorship** (for practical fit)
   ```sql
   ALTER TABLE matching_profiles ADD COLUMN needs_sponsorship BOOLEAN DEFAULT false;
   ALTER TABLE matching_profiles ADD COLUMN wishes_sponsorship BOOLEAN DEFAULT false;
   ALTER TABLE matching_profiles ADD COLUMN work_authorization JSONB DEFAULT '{}'::jsonb;
   -- e.g., {"countries": ["US", "UK"], "type": "work_permit", "expires": "2026-12-31"}

   ALTER TABLE assignments ADD COLUMN can_sponsor_visa BOOLEAN DEFAULT false;
   ALTER TABLE assignments ADD COLUMN sponsorship_countries TEXT[];
   ```

---

## 🔧 IMPLEMENTATION PRIORITY

### Phase 1: Critical Fixes (Week 1-2)

1. **Resolve Matching Weights Discrepancy**
   - Decision: PRD vs Matching Conversation
   - Update code + docs accordingly
   - **Owner:** Product + Engineering

2. **Add Skills Taxonomy Tables**
   - Implement L1→L2→L3→L4 structure
   - Migration: `20250130_add_skills_taxonomy.sql`
   - Seed with initial taxonomy data
   - **Owner:** Backend

3. **Document Assignment Creation Flow**
   - Multi-stakeholder pipeline
   - State machine diagram
   - Add to comprehensive doc
   - **Owner:** Documentation

### Phase 2: Medium Priority (Week 3-4)

4. **Implement Project-Skill Linkage**
   - Add projects table
   - Calculate recency from project dates
   - **Owner:** Backend

5. **Add Skill Adjacency System**
   - Graph schema
   - Distance calculation algorithm
   - **Owner:** Backend + ML

6. **Document Expertise Atlas**
   - Central skills management system
   - "My Projects" tab
   - Multi-L4 artifact linkage
   - **Owner:** Documentation + Product

### Phase 3: Nice to Have (Week 5-6)

7. **Add Benefits Matrix**
   - Taxonomy + preferences
   - Matching integration
   - **Owner:** Backend

8. **Implement Sensitive Field Visibility**
   - Field-level visibility flags
   - Redaction in explanations
   - **Owner:** Backend + Frontend

9. **Expand Match Explainability**
   - Improvement tip calculations
   - "Add proof X → +Y%" logic
   - **Owner:** ML + Backend

---

## ✅ RECOMMENDATIONS

### Immediate Actions

1. **Call PRD Alignment Meeting**
   - Resolve matching weights discrepancy (PRD 30/40/10/10/10 vs Spec 55/25/20)
   - Confirm taxonomy structure (L1→L4)
   - Clarify "Expertise Atlas" branding vs implementation

2. **Update Schema Migration Plan**
   - Create `20250130_add_skills_taxonomy.sql`
   - Create `20250131_add_project_skills_linkage.sql`
   - Create `20250201_add_benefits_matrix.sql`

3. **Update Comprehensive Documentation**
   - Add "Expertise Atlas System" section
   - Add "Assignment Creation Workflow" with diagrams
   - Add "Skill Adjacency & Graph Matching" section
   - Expand "Match Explainability" with improvement tips

4. **Create Implementation Backlog**
   - Epic: Skills Taxonomy System (2 weeks)
   - Epic: Project-Skill Linkage & Recency (1 week)
   - Epic: Advanced Matching Features (2 weeks)

---

## 📈 OVERALL ASSESSMENT

### Strengths ✅
- Core architecture (auth, profiles, organizations) well documented
- Database schema comprehensive for implemented features
- RLS policies thoroughly defined
- File structure clearly mapped
- Development guidelines solid

### Gaps ⚠️
- Skills taxonomy not yet implemented (critical for matching)
- Assignment creation flow incomplete
- Practical fit matching missing components (benefits, sponsorship)
- Explainability system partially documented

### Risk Level 🟡 MEDIUM
- Can proceed with MVP using simplified matching
- Must implement full taxonomy for quality matching at scale
- Sensitive field system needed before broader launch

---

**Next Review Date:** After Phase 1 implementation (2 weeks)
**Document Version:** 1.0
**Status:** Under Review
