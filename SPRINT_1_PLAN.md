# Sprint 1 Planning Document
**Epic:** E1 - Skills Taxonomy System
**Sprint Duration:** 2 weeks (10 working days)
**Sprint Capacity:** 40 story points (2 developers × 10 points/week × 2 weeks)
**Sprint Points Committed:** 39 points
**Sprint Dates:** TBD
**Team:** 2 Full-stack Developers

---

## Sprint Goals

### Primary Goal
Build the foundation of the 4-level skills taxonomy system (L1→L2→L3→L4) with initial data population and semantic search capabilities.

### Success Criteria
- [ ] 4-level taxonomy structure in database
- [ ] 1,000+ L4 granular skills populated
- [ ] Skill embeddings generated and indexed
- [ ] API endpoints functional for skill search
- [ ] Skills can be searched by name and semantically similar terms

### Definition of Done
- [ ] All code merged to main branch
- [ ] Database migrations applied successfully
- [ ] Unit tests written with >80% coverage
- [ ] API endpoints documented
- [ ] Manual QA completed
- [ ] No critical bugs

---

## User Stories

### E1-US1: Design & Seed L1 Categories
**Story Points:** 5
**Priority:** P0 (Blocker)
**Assignee:** Dev 1
**Days:** 1 day

#### Description
As a data engineer, I want to design the L1 category structure and seed it with 6 top-level skill domains, so that we have the foundation for the hierarchical taxonomy.

#### Acceptance Criteria
- [ ] 6 L1 categories defined and documented:
  - 01: Technology & Engineering
  - 02: Business & Operations
  - 03: Creative & Design
  - 04: Human & Social
  - 05: Science & Research
  - 06: Trades & Services
- [ ] Each L1 has slug, i18n names (en), description, icon
- [ ] Migration file updated with seed data
- [ ] RLS policies applied to skills_categories table
- [ ] API endpoint created: `GET /api/skills/categories`

#### Technical Tasks
1. Update migration `20250130_add_skills_taxonomy.sql` with L1 seed data
2. Create API route `/api/skills/categories`
3. Add Zod validation schema for L1 categories
4. Write unit tests for L1 CRUD operations
5. Document L1 structure in `SYSTEM_ARCHITECTURE_SUPPLEMENT.md`

#### Dependencies
- None (foundation task)

---

### E1-US2: Define L2 & L3 Subcategories
**Story Points:** 8
**Priority:** P0 (Blocker)
**Assignee:** Dev 2
**Days:** 1.5 days

#### Description
As a data engineer, I want to define L2 and L3 subcategories under each L1 category, so that we can organize skills hierarchically with 3-4 levels of granularity.

#### Acceptance Criteria
- [ ] L2 subcategories defined for all 6 L1 categories (~30-40 L2 categories total)
- [ ] L3 categories defined under high-priority L2 categories (~50-70 L3 categories)
- [ ] Each L2/L3 has slug, i18n names, description
- [ ] Foreign key relationships properly established
- [ ] Unique constraints on slugs enforced
- [ ] API endpoints created:
  - `GET /api/skills/subcategories?cat_id={id}`
  - `GET /api/skills/l3?subcat_id={id}`

#### Example Structure
```
L1: 01 Technology & Engineering
  ├── L2: 01.01 Software Development
  │   ├── L3: 01.01.01 Frontend Development
  │   ├── L3: 01.01.02 Backend Development
  │   └── L3: 01.01.03 Full-Stack Development
  ├── L2: 01.02 Data & Analytics
  │   ├── L3: 01.02.01 Data Engineering
  │   └── L3: 01.02.02 Data Science
  └── L2: 01.03 DevOps & Infrastructure
      └── L3: 01.03.01 Cloud Infrastructure
```

#### Technical Tasks
1. Research existing skill taxonomies (O*NET, ESCO, LinkedIn) for structure
2. Design L2/L3 hierarchy with product team input
3. Update migration with L2/L3 seed data
4. Create API routes for L2/L3 CRUD
5. Write unit tests for hierarchical queries
6. Document L2/L3 structure with examples

#### Dependencies
- E1-US1 (needs L1 categories to exist)

---

### E1-US3: Populate L4 Skills (Initial 1,000)
**Story Points:** 13
**Priority:** P0 (Blocker)
**Assignee:** Dev 1 + Dev 2
**Days:** 3 days

#### Description
As a data engineer, I want to populate the skills_taxonomy table with 1,000+ L4 granular skills, so that users can select relevant skills for their profiles.

#### Acceptance Criteria
- [ ] 1,000+ L4 skills across all L1 categories
- [ ] Each skill has: code (e.g., `01.01.01.001`), slug, i18n name, aliases, description, tags
- [ ] Skill codes follow format: `XX.YY.ZZ.NNN` (zero-padded)
- [ ] Skills distributed across categories (no empty L3s)
- [ ] CSV/JSON seed files for easy import
- [ ] Duplicate detection and validation scripts
- [ ] Skills cover high-demand areas first (tech, business, design)
- [ ] API endpoint created: `GET /api/skills/search?q={query}`

#### Example Skills
```json
{
  "code": "01.01.01.001",
  "cat_id": 1,
  "subcat_id": 1,
  "l3_id": 1,
  "skill_id": 1,
  "slug": "react",
  "name_i18n": {"en": "React"},
  "aliases_i18n": {"en": ["React.js", "ReactJS", "React Framework"]},
  "description_i18n": {"en": "A JavaScript library for building user interfaces"},
  "tags": ["frontend", "javascript", "ui", "spa"],
  "status": "active"
}
```

#### Technical Tasks
1. Create skill population script `scripts/populate-skills.ts`
2. Source initial 1,000 skills from:
   - O*NET taxonomy
   - LinkedIn Skills API (if available)
   - Manual curation for high-demand skills
3. Write CSV/JSON validator script
4. Create batch insert function with conflict resolution
5. Add duplicate detection (by slug, aliases)
6. Write data quality tests (validate all FKs, no orphans)
7. Create search API with full-text search
8. Write integration tests for search API

#### Data Distribution Target
- **Technology & Engineering:** 400 skills (40%)
- **Business & Operations:** 250 skills (25%)
- **Creative & Design:** 150 skills (15%)
- **Human & Social:** 100 skills (10%)
- **Science & Research:** 70 skills (7%)
- **Trades & Services:** 30 skills (3%)

#### Dependencies
- E1-US2 (needs L2/L3 structure to be defined)

---

### E1-US4: Implement Skill Embeddings
**Story Points:** 13
**Priority:** P1 (High)
**Assignee:** Dev 2
**Days:** 3 days

#### Description
As a matching engineer, I want to generate vector embeddings for all skills using multilingual-e5-large model, so that we can perform semantic skill matching and find adjacent skills.

#### Acceptance Criteria
- [ ] Embedding generation script created
- [ ] All 1,000+ skills have 768-dimensional embeddings
- [ ] HNSW index created on embeddings column
- [ ] Semantic search API endpoint: `GET /api/skills/similar?skill_code={code}&limit=10`
- [ ] Returns semantically similar skills with distance scores
- [ ] Embedding generation takes <10 minutes for 1,000 skills
- [ ] Index creation takes <5 minutes

#### Technical Details

**Model:** `intfloat/multilingual-e5-large`
- Dimensions: 768
- Language support: Multilingual (including English)
- Advantages: SOTA performance on semantic similarity tasks

**Embedding Input Format:**
```
"query: {skill_name} {aliases} {description}"
```

**HNSW Index Parameters:**
```sql
CREATE INDEX ON skills_taxonomy
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**API Response Example:**
```json
{
  "query_skill": {
    "code": "01.01.01.001",
    "name": "React"
  },
  "similar_skills": [
    {
      "code": "01.01.01.002",
      "name": "Vue.js",
      "distance": 0.15,
      "similarity": 0.85
    },
    {
      "code": "01.01.01.003",
      "name": "Angular",
      "distance": 0.18,
      "similarity": 0.82
    }
  ]
}
```

#### Technical Tasks
1. Set up embedding generation environment (Python/Node.js)
2. Install `sentence-transformers` or use HuggingFace API
3. Create embedding generation script:
   - Read skills from database
   - Generate embeddings in batches (100 skills/batch)
   - Update skills_taxonomy table
4. Create HNSW index on embeddings column
5. Implement semantic search API endpoint
6. Write performance tests (query <100ms)
7. Document embedding generation process
8. Create cron job/GitHub Action for regenerating embeddings when skills change

#### Performance Requirements
- Embedding generation: <10 min for 1,000 skills
- Semantic search query: <100ms per request
- Index creation: <5 min

#### Dependencies
- E1-US3 (needs 1,000 skills to be populated)

---

## Sprint Schedule (10 Days)

### Week 1 (Days 1-5)

#### Day 1 (Monday)
- **Dev 1:** E1-US1 (Design & Seed L1 Categories) - Complete
- **Dev 2:** E1-US2 (Define L2 & L3 Subcategories) - Start

#### Day 2 (Tuesday)
- **Dev 1:** E1-US3 (Populate L4 Skills) - Start (research taxonomies, create script)
- **Dev 2:** E1-US2 (Define L2 & L3 Subcategories) - Complete

#### Day 3 (Wednesday)
- **Dev 1:** E1-US3 (Populate L4 Skills) - Continue (source 500 skills)
- **Dev 2:** E1-US3 (Populate L4 Skills) - Join (source remaining 500 skills)

#### Day 4 (Thursday)
- **Dev 1:** E1-US3 (Populate L4 Skills) - Validation & testing
- **Dev 2:** E1-US3 (Populate L4 Skills) - API & search implementation

#### Day 5 (Friday)
- **Dev 1:** E1-US3 (Populate L4 Skills) - Complete & code review
- **Dev 2:** E1-US4 (Implement Skill Embeddings) - Start (setup environment, research model)

### Week 2 (Days 6-10)

#### Day 6 (Monday)
- **Dev 1:** Buffer time / Start E1-US5 prep work
- **Dev 2:** E1-US4 (Implement Skill Embeddings) - Generate embeddings for all skills

#### Day 7 (Tuesday)
- **Dev 1:** Code review for E1-US4
- **Dev 2:** E1-US4 (Implement Skill Embeddings) - Create HNSW index

#### Day 8 (Wednesday)
- **Dev 1:** Integration testing across all E1 stories
- **Dev 2:** E1-US4 (Implement Skill Embeddings) - Implement semantic search API

#### Day 9 (Thursday)
- **Dev 1:** Documentation updates
- **Dev 2:** E1-US4 (Implement Skill Embeddings) - Complete & testing

#### Day 10 (Friday)
- **Both:** Sprint review prep, demo preparation
- **Both:** Sprint retrospective
- **Both:** Sprint 2 planning

---

## Testing Strategy

### Unit Tests (Target: 80%+ coverage)
- [ ] L1/L2/L3/L4 CRUD operations
- [ ] Foreign key constraints enforcement
- [ ] Unique constraint validation
- [ ] Skill code format validation
- [ ] Duplicate detection logic

### Integration Tests
- [ ] Full taxonomy hierarchy creation
- [ ] Skill search with filters
- [ ] Semantic search returns relevant results
- [ ] API performance <100ms per request

### Manual QA Checklist
- [ ] Browse L1→L2→L3→L4 hierarchy in UI
- [ ] Search for skills by name (exact match)
- [ ] Search for skills by alias
- [ ] Semantic search: "JavaScript framework" → React, Vue, Angular
- [ ] Verify 1,000+ skills distributed across categories
- [ ] Check for duplicate skills

---

## Risks & Mitigation

### Risk 1: Skill Taxonomy Structure Disagreement
**Probability:** Medium
**Impact:** High
**Mitigation:**
- Schedule taxonomy review meeting with product team on Day 1
- Get sign-off on L1/L2 structure before proceeding to L3/L4
- Document decisions in ADR (Architecture Decision Record)

### Risk 2: Embedding Generation Takes Too Long
**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Use batch processing (100 skills at a time)
- Consider using HuggingFace Inference API for faster generation
- Have fallback: Skip embeddings for Sprint 1, defer to Sprint 2

### Risk 3: Insufficient Skill Data Sources
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Pre-identify 3 data sources: O*NET, ESCO, manual curation
- Allocate 1 day buffer for manual curation if needed
- Start with high-demand areas (tech, business) first

---

## Dependencies & Blockers

### External Dependencies
- None (all work can be done independently)

### Internal Dependencies
- E1-US2 depends on E1-US1 (L1 must exist before L2/L3)
- E1-US3 depends on E1-US2 (L2/L3 must exist before L4)
- E1-US4 depends on E1-US3 (skills must exist before embeddings)

### Known Blockers
- None currently

---

## Technical Debt & Future Work

### Technical Debt Created in Sprint 1
- Embeddings regeneration not automated (manual script)
- Only 1,000 skills (target 10,000+ for GA)
- No skill versioning system yet
- No multilingual support (English only)

### Deferred to Sprint 2
- E1-US5: Update Existing Skills Table (8 pts)
- E1-US6: Skills Taxonomy API Endpoints (8 pts)
- Skill adjacency graph population (Epic 4)

---

## Sprint Ceremonies

### Daily Standups
**Time:** 9:30 AM daily
**Duration:** 15 minutes
**Format:**
- What did you complete yesterday?
- What are you working on today?
- Any blockers?

### Sprint Planning
**Date:** Day 0 (Friday before Sprint 1)
**Duration:** 2 hours
**Attendees:** Dev team, Product Owner, Tech Lead

### Sprint Review / Demo
**Date:** Day 10 (Friday, Week 2)
**Duration:** 1 hour
**Demo Items:**
- Taxonomy hierarchy (L1→L2→L3→L4)
- Search 1,000+ skills by name
- Semantic search for similar skills
- API documentation

### Sprint Retrospective
**Date:** Day 10 (Friday, Week 2, after review)
**Duration:** 1 hour
**Format:** Start/Stop/Continue

---

## Sprint Metrics

### Velocity Tracking
- **Planned Points:** 39
- **Completed Points:** TBD
- **Spillover Points:** TBD
- **Team Velocity:** TBD (baseline for Sprint 2)

### Code Quality Metrics
- **Unit Test Coverage:** Target >80%
- **Code Review Turnaround:** Target <4 hours
- **Build Success Rate:** Target 100%

### Performance Metrics
- **API Response Time:** Target <100ms (p95)
- **Embedding Generation Time:** Target <10 min for 1,000 skills
- **Database Query Time:** Target <50ms for search

---

## Resources

### Documentation
- [IMPLEMENTATION_BACKLOG.md](./IMPLEMENTATION_BACKLOG.md) - Full roadmap
- [SYSTEM_ARCHITECTURE_SUPPLEMENT.md](./SYSTEM_ARCHITECTURE_SUPPLEMENT.md) - Skills taxonomy design
- [Proofound_Matching_Conversation.md](./Proofound_Matching_Conversation.md) - Matching algorithm spec

### Tools & Technologies
- **Database:** PostgreSQL 15+ with pgvector extension
- **Embeddings:** Hugging Face `intfloat/multilingual-e5-large`
- **API:** Next.js 15 App Router
- **ORM:** Drizzle ORM 0.29+
- **Testing:** Vitest + Playwright

### External Resources
- O*NET Taxonomy: https://www.onetonline.org/
- ESCO Skills: https://esco.ec.europa.eu/
- LinkedIn Skills Graph: https://engineering.linkedin.com/blog/2022/building-the-skills-graph

---

## Sprint Retrospective Template (To be filled after Sprint 1)

### What Went Well? (Start)
- TBD

### What Didn't Go Well? (Stop)
- TBD

### What Can We Improve? (Continue)
- TBD

### Action Items for Sprint 2
- TBD
