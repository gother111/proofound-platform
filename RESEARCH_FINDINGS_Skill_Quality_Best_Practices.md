# Research Findings: Skill Taxonomy Quality Best Practices

_Generated: 2025-10-31_

## Executive Summary

Research into ESCO (European standard), O\*NET (US standard), and LinkedIn Skills Graph reveals clear patterns for creating high-quality, professional skill taxonomies. This document synthesizes findings to enhance Expertise Atlas L4 skills.

---

## 1. ESCO (European Skills, Competences, Qualifications and Occupations)

### Overview

- **Total Skills**: 13,939 (v1.2.0, May 2024)
- **Occupations Covered**: 3,039
- **Languages**: 28
- **Structure**: Hierarchical (4+ levels)

### Key Structure Elements

#### 1.1 Skill Naming Conventions

**Examples from ESCO:**

- ✅ "train crew members"
- ✅ "manage logistics"
- ✅ "negotiating"

**Pattern**: Verb-based, action-oriented, concise (2-4 words)

#### 1.2 Description Format

```
CREATE logistic framework for transporting goods to customers and
for receiving returns, EXECUTE and follow up the logistics processes
and guidelines.
```

**Best Practices:**

- 1-2 sentences
- Action verbs (create, execute, manage, analyze)
- Specific outcomes/deliverables
- Plain language (no jargon)

#### 1.3 Alternative Labels (Synonyms)

ESCO provides **multiple alternative labels** per skill:

**Example: "manage logistics"**

- supervise logistics
- managing logistics
- logistics management
- regulate logistics
- maintain logistics
- oversee logistics

**Insight**: ~5-7 synonyms per canonical skill

#### 1.4 Hierarchical Structure

```
S - Skills (Root)
  ├── S1 - Communication, collaboration and creativity
  │     ├── S1.3 - Teaching and training
  │     │     ├── S1.3.3 - Training on operational procedures
  │     │     │     └── train crew members (LEAF)
```

**Pattern**:

- 3-4 levels before reaching granular skills
- Clear parent-child relationships
- Broader → Narrower progression

#### 1.5 Metadata Richness

Each skill includes:

- **URI** (unique identifier)
- **Preferred label** (28 languages)
- **Alternative labels**
- **Description**
- **Scope note** (what's excluded)
- **Skill type** (skill vs. knowledge)
- **Reuse level** (cross-sector vs. occupation-specific)

---

## 2. O\*NET (Occupational Information Network - US Department of Labor)

### Overview

- **Core Skills**: 35 standardized competencies
- **Task Statements**: 19,000+ occupation-specific
- **Work Activities**: 2,000+
- **Occupations**: 1,016

### Key Structure Elements

#### 2.1 Skill Definition Format

**Example: "Active Listening" (2.A.1.b)**

**Definition:**

> Giving full attention to what other people are saying, taking time to understand the points being made, asking questions as appropriate, and not interrupting at inappropriate times.

**Pattern:**

- Gerund-based ("Giving", "Taking", "Using")
- Multi-clause structure explaining HOW
- Specific behavioral components
- 25-40 words

#### 2.2 Proficiency Scale Integration

O\*NET ties skills to **proficiency levels** with concrete examples:

**Active Listening Scale:**

- **Level 85**: Serve as a judge in a complex legal disagreement
- **Level 57**: Answer inquiries regarding credit references
- **Level 28**: Take a customer's order

**Insight**: Proficiency is separate from skill identity, demonstrated through real work examples

#### 2.3 Skill Categories

```
Basic Skills
  ├── Content Skills (reading, active learning)
  ├── Process Skills (critical thinking, monitoring)
  └── ...

Cross-Functional Skills
  ├── Social Skills (persuasion, negotiation)
  ├── Complex Problem Solving
  ├── Technical Skills
  ├── Systems Skills
  └── Resource Management Skills
```

**Total**: 35 core skills organized into 7 categories

#### 2.4 Occupational Linkage

Each skill shows:

- **894 occupations** require "Active Listening"
- Importance score (0-100)
- Required level (0-100)
- Job zone (1-5 complexity)

---

## 3. LinkedIn Skills Graph

### Overview

- **Total Skills**: 39,000+
- **Aliases**: 374,000+ (9.6 aliases per skill average!)
- **Connections**: 200,000+ skill-to-skill edges
- **Languages**: 26

### Key Insights

#### 3.1 Synonym Management at Scale

LinkedIn's **374,000 aliases** for 39,000 skills shows:

- Average **9-10 synonyms per canonical skill**
- Includes variations like:
  - "JavaScript" → "JS", "Javascript", "JavaScript programming", "Node.js development"
  - "Project Management" → "PM", "Managing Projects", "Programme Management"

#### 3.2 Dynamic Growth Model

- Grew **35% since 2021** (from ~29k to 39k)
- User-generated + AI-curated
- Continuous synonym consolidation

#### 3.3 Skill Clustering

LinkedIn maps **relationships between skills**:

- "Python" ↔ "Data Science" (strong edge)
- "Leadership" ↔ "Team Management" (related)
- Enables skill recommendations

---

## 4. Comparative Analysis: Quality Dimensions

| Dimension        | ESCO             | O\*NET              | LinkedIn         | Expertise Atlas (Current) |
| ---------------- | ---------------- | ------------------- | ---------------- | ------------------------- |
| **Total Skills** | 13,939           | 35 core + 19k tasks | 39,000           | 21,360                    |
| **Descriptions** | ✅ 1-2 sentences | ✅ Detailed         | ❌ Not public    | ❌ None                   |
| **Synonyms**     | ✅ 5-7 per skill | ❌ Not structured   | ✅ 9.6 per skill | ❌ None                   |
| **Hierarchy**    | ✅ 4 levels      | ✅ 7 categories     | ✅ Clustered     | ✅ 4 levels (L1-L4)       |
| **Multilingual** | ✅ 28 languages  | ❌ English only     | ✅ 26 languages  | ❌ English only           |
| **Proficiency**  | ❌ Not explicit  | ✅ 0-100 scale      | ❌ Endorsements  | ✅ 1-5 levels (separate)  |
| **Granularity**  | Medium           | High (tasks)        | Medium-High      | Medium-High               |

---

## 5. Best Practices for Expertise Atlas

### 5.1 Naming Conventions

#### ✅ DO:

- Use **verb-based names**: "Public speaking", "Data visualization", "Contract negotiation"
- Keep **concise** (2-5 words)
- Be **specific**: "JavaScript programming" not "Programming"
- Use **active voice**: "Managing teams" not "Team management performed"

#### ❌ DON'T:

- Include proficiency: ~~"Advanced Python"~~ → "Python programming"
- Add context variations: ~~"Communication for Teams"~~ → "Team communication"
- Use generic prefixes: ~~"Basic Excel"~~ → "Excel spreadsheet analysis"
- Mix categories: ~~"Leadership and Management"~~ → Pick one, link in relationships

### 5.2 Description Template

Based on ESCO/O\*NET best practices:

```markdown
**Skill Name**: [Verb + Object/Context]

**Description**: [Action verb] + [what is done] + [to achieve what outcome].
[Optional: Includes specific techniques/methods/tools used].

**Examples**:

- [Concrete example 1]
- [Concrete example 2]

**Related Skills**: [Link to 3-5 related L4 skills]
```

**Real Example:**

```json
{
  "name": "Public speaking to large audiences",
  "description": "Deliver presentations, speeches, or talks to audiences of 50+ people, managing stage presence, audience engagement, and message clarity. Includes adapting content in real-time based on audience reactions.",
  "examples": [
    "Conference keynote presentations",
    "Town hall meetings",
    "Webinar hosting to 100+ participants"
  ],
  "related_skills": [
    "Storytelling and narrative",
    "Slide design and visual aids",
    "Q&A facilitation",
    "Voice projection and modulation"
  ],
  "l3_name": "Verbal communication"
}
```

### 5.3 Synonym Management Strategy

#### Current Gap

Our 21,360 skills likely have **2,000-4,000 duplicates** (10-20% redundancy rate)

Examples found in our dataset:

- "Verbal communication in Technology"
- "Technical verbal communication"
  → Should be ONE skill with aliases

#### Recommended Approach

1. **Canonical skill** (1 primary name)
2. **5-10 aliases** per skill
3. **Total searchable terms**: ~25,000-30,000

**Data Structure:**

```json
{
  "id": "uuid",
  "canonical_name": "JavaScript programming",
  "aliases": [
    "JS development",
    "Programming in JavaScript",
    "JavaScript coding",
    "ECMAScript programming",
    "Node.js backend development"
  ],
  "description": "...",
  "search_terms": ["javascript", "js", "ecmascript", "node", "typescript"],
  "category": "programming_languages"
}
```

### 5.4 Quality Metrics to Track

| Metric                    | Target | Current   | Gap       |
| ------------------------- | ------ | --------- | --------- |
| Skills with descriptions  | 100%   | 0%        | ❌ High   |
| Skills with 3+ aliases    | 80%    | 0%        | ❌ High   |
| Duplicate skills (exact)  | <1%    | ~5% est.  | ❌ Medium |
| Near-duplicates           | <2%    | ~10% est. | ❌ High   |
| Skills with related links | 80%    | 0%        | ❌ High   |
| Search success rate       | >90%   | Unknown   | ?         |

---

## 6. Actionable Recommendations

### Phase 1: Immediate Quality Enhancements (Week 1)

**Priority 1: Add Descriptions**

- Generate 1-2 sentence descriptions for all 21,360 skills
- Use AI-assisted generation with manual review sampling
- Template: "Verb + what + outcome"

**Priority 2: Identify Duplicates**

- Run fuzzy matching (Levenshtein distance)
- Group near-duplicates (e.g., "manage logistics" vs "logistics management")
- Create consolidation plan

**Priority 3: Standardize Naming**

- Remove generic prefixes ("Small-scale", "Medium-scale")
- Ensure verb-first structure
- Fix capitalization inconsistencies

### Phase 2: Synonym System (Week 2)

**Build Infrastructure:**

- Add `skill_aliases` table
- Implement fuzzy search across names + aliases
- Create curator tools for synonym approval

**Populate Aliases:**

- Generate 5-7 aliases per skill (AI-assisted)
- Prioritize high-traffic skills first
- Manual review of top 1000 skills

### Phase 3: Relationship Mapping (Week 3-4)

**Add Related Skills:**

- Link L4 skills within same L3
- Cross-L3 relationships (e.g., "Python" ↔ "Data analysis")
- Prerequisite chains (e.g., "Advanced X" requires "Intermediate X")

**Enable Discovery:**

- "People who know X also know Y"
- Skill gap analysis
- Learning path suggestions

---

## 7. Implementation Checklist

### Immediate (This Week)

- [x] Research ESCO, O\*NET, LinkedIn ✅
- [ ] Analyze current 21k skills for quality issues
- [ ] Create description generation script
- [ ] Run duplicate detection
- [ ] Document naming standards

### Short-term (Next 2 Weeks)

- [ ] Add descriptions to all skills
- [ ] Consolidate duplicates → ~18-19k canonical skills
- [ ] Build synonym infrastructure
- [ ] Generate 5-7 aliases per skill
- [ ] Update database schema

### Medium-term (Next Month)

- [ ] Implement fuzzy search
- [ ] Create curator dashboard
- [ ] Add skill relationships
- [ ] User-generated skill workflow
- [ ] Quality monitoring dashboard

---

## 8. Success Criteria

After enhancement, Expertise Atlas should achieve:

✅ **Completeness**: Every skill has description, 5+ aliases, related skills
✅ **Consistency**: Standardized naming, no duplicates
✅ **Discoverability**: 90%+ search success rate
✅ **Accuracy**: Manual review confirms skill definitions match industry standards
✅ **Usability**: Users find what they need in <30 seconds
✅ **Maintainability**: Clear curation guidelines, automated quality checks

---

## 9. References

### Data Sources

- ESCO v1.2.0 API: https://ec.europa.eu/esco/api/
- O\*NET Database v30.0: https://www.onetcenter.org/database.html
- LinkedIn Skills Blog: https://www.linkedin.com/blog/engineering/skills-graph/

### Standards Referenced

- ISO 25964: Thesauri and interoperability with other vocabularies
- Dublin Core Metadata Initiative
- SKOS (Simple Knowledge Organization System)

### Tools to Explore

- `fuzzywuzzy` (Python) - String similarity
- `sentence-transformers` - Semantic similarity
- Elasticsearch - Full-text search with synonyms
- Neo4j - Skill graph relationships

---

## Appendix A: Sample Skills with Full Enhancement

### Example 1: From Our Dataset

**Before:**

```json
{
  "name": "Verbal communication in Technology"
}
```

**After (Enhanced):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "canonical_name": "Technical verbal communication",
  "aliases": [
    "Verbal communication in technology",
    "Tech talk delivery",
    "Explaining technical concepts verbally",
    "Technical presentations",
    "Developer communication",
    "Engineering discussions"
  ],
  "description": "Communicate complex technical concepts verbally to varied audiences, including developers, stakeholders, and non-technical users. Adapt terminology and depth based on audience technical proficiency.",
  "examples": [
    "Explaining API architecture to product managers",
    "Sprint planning discussions",
    "Technical demos to clients",
    "Code review conversations"
  ],
  "related_skills": [
    "Technical documentation writing",
    "Whiteboard diagramming",
    "Presentation skills",
    "Active listening",
    "Audience analysis"
  ],
  "l1_code": "U",
  "l2_code": "U-COMM",
  "l3_name": "Verbal communication",
  "skill_type": "competence",
  "reuse_level": "cross-sector",
  "created_at": "2025-10-31",
  "updated_at": "2025-10-31",
  "version": "2.0.0"
}
```

---

**END OF DOCUMENT**
