# 🗺️ Expertise Atlas: Visual Map

## The Complete Taxonomy Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         L1: 6 TOP-LEVEL DOMAINS                     │
│                           (skills_categories)                        │
└─────────────────────────────────────────────────────────────────────┘
         │
         ├─── [U] Universal Capabilities (~2,688 L4 skills)
         │     ├─ U-COMM: Communication
         │     ├─ U-COLL: Collaboration & Teamwork
         │     ├─ U-LEAD: Leadership & People Enablement
         │     ├─ U-COACH: Coaching & Mentoring
         │     ├─ U-NEGOT: Negotiation & Mediation
         │     ├─ U-INFL: Influence & Stakeholder Mgmt
         │     ├─ U-CUST: Service & Client Orientation
         │     ├─ U-ETHIC: Ethics & Responsible Judgment
         │     ├─ U-CRIT: Critical Thinking & Reasoning
         │     ├─ U-CREAT: Creativity & Ideation
         │     ├─ U-PROBL: Problem Solving & Decision Making
         │     ├─ U-LEARN: Learning Agility
         │     ├─ U-ADAPT: Adaptability & Change Readiness
         │     ├─ U-RESIL: Resilience & Stress Tolerance
         │     ├─ U-TIME: Time & Priority Management
         │     └─ U-ORGAN: Personal Organization
         │
         ├─── [F] Functional Competencies (~5,040 L4 skills)
         │     ├─ F-PROD: Product Management
         │     ├─ F-PROJ: Project Management
         │     ├─ F-OPER: Operations Management
         │     ├─ F-FIN: Finance & Accounting
         │     ├─ F-MARK: Marketing
         │     ├─ F-SALE: Sales & BD
         │     ├─ F-HR: People & Culture
         │     └─ ... (and more)
         │
         ├─── [T] Tools & Technologies (~3,920 L4 skills)
         │     ├─ T-DEV: Development & Engineering
         │     ├─ T-DATA: Data & Analytics
         │     ├─ T-DESIGN: Design Tools
         │     ├─ T-COLLAB: Collaboration Platforms
         │     ├─ T-CLOUD: Cloud & Infrastructure
         │     └─ ... (and more)
         │
         ├─── [L] Languages & Culture (~1,568 L4 skills)
         │     ├─ L-LANG: Language Proficiency
         │     ├─ L-CULT: Cultural Competencies
         │     └─ ... (and more)
         │
         ├─── [M] Methods & Practices (~3,248 L4 skills)
         │     ├─ M-AGILE: Agile & Scrum
         │     ├─ M-DESIGN: Design Thinking
         │     ├─ M-LEAN: Lean & Six Sigma
         │     └─ ... (and more)
         │
         └─── [D] Domain Knowledge (~3,472 L4 skills)
               ├─ D-HEALTH: Healthcare
               ├─ D-FIN: Financial Services
               ├─ D-TECH: Technology
               ├─ D-CLIMATE: Climate & Sustainability
               └─ ... (and more)

═════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│              L2: CATEGORIES WITHIN EACH DOMAIN (~220)               │
│                      (skills_subcategories)                         │
└─────────────────────────────────────────────────────────────────────┘

Example for U (Universal Capabilities):
  U-COMM → Communication (16 L3 items)
  U-COLL → Collaboration & Teamwork (8 L3 items)
  U-LEAD → Leadership & People Enablement (8 L3 items)
  ... (16 total L2 categories under U)

═════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│          L3: SUBCATEGORIES WITHIN EACH L2 (~1,600+)                │
│                         (skills_l3)                                 │
└─────────────────────────────────────────────────────────────────────┘

Example for U-COMM (Communication):
  ├─ Verbal communication
  ├─ Written communication
  ├─ Nonverbal cues & body language
  ├─ Active listening & questioning
  ├─ Audience analysis & tailoring
  ├─ Meeting facilitation & minutes
  ├─ Feedback & feedforward
  └─ Asynchronous communication hygiene

═════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│         L4: GRANULAR SKILLS (~20,000 curated + custom)             │
│                      (skills_taxonomy)                              │
└─────────────────────────────────────────────────────────────────────┘

Example for "Verbal communication" (L3):
  ├─ Verbal communication - Foundational
  ├─ Verbal communication - Intermediate
  ├─ Verbal communication - Advanced
  ├─ Verbal communication - Expert
  ├─ Verbal communication - Master
  ├─ Verbal communication for Teams
  ├─ Verbal communication for Leaders
  ├─ Verbal communication in Remote Settings
  ├─ Verbal communication in Crisis
  ├─ Verbal communication Cross-culturally
  └─ Verbal communication in High-Pressure Situations

═════════════════════════════════════════════════════════════════════
═════════════════════════════════════════════════════════════════════

## User Skill Journey

```
┌─────────────────┐
│  User Profile   │
└────────┬────────┘
         │
         │ adds skill
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        USER SKILL ENTRY                         │
│                           (skills)                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ skill_code: "01.01.01.001"                               │ │
│  │ level: 4 (C4 - Expert)                                   │ │
│  │ monthsExperience: 36                                     │ │
│  │ lastUsedAt: 2025-09-15                                   │ │
│  │ relevance: "current"                                     │ │
│  │ evidenceStrength: 0.85  ← computed from proofs           │ │
│  │ recencyMultiplier: 0.95 ← recent usage                   │ │
│  │ impactScore: 0.78       ← from projects                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ references
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               TAXONOMY ENTRY (skills_taxonomy)                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ code: "01.01.01.001" ← PRIMARY KEY                       │ │
│  │ name: "Verbal communication - Foundational"              │ │
│  │ catId: 1     → [U] Universal Capabilities                │ │
│  │ subcatId: 101 → [U-COMM] Communication                   │ │
│  │ l3Id: 1001   → Verbal communication                      │ │
│  │ tags: ["communication", "speaking", "foundational"]      │ │
│  │ embedding: [0.12, -0.45, ...] ← AI semantic vector       │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  skill_l3    │    │ subcat table │    │  category    │
│              │    │              │    │   table      │
│ l3Id: 1001   │    │ subcatId:101 │    │  catId: 1    │
│ "Verbal      │    │ "Communic..  │    │ "Universal   │
│  communic.." │    │              │    │  Capabil.."  │
└──────────────┘    └──────────────┘    └──────────────┘
```

═════════════════════════════════════════════════════════════════════

## Proof & Verification Flow

```
┌────────────────────────────────────────────────────────────────┐
│                        USER SKILL                              │
│         "Verbal communication - Foundational" (L4)             │
└────────────────────────────────────────────────────────────────┘
              │                           │
              │ has many                  │ has many
              ▼                           ▼
    ┌─────────────────┐         ┌──────────────────────┐
    │  SKILL PROOFS   │         │ VERIFICATION         │
    │                 │         │ REQUESTS             │
    ├─────────────────┤         ├──────────────────────┤
    │ • Project       │         │ Status: accepted     │
    │ • Certification │         │ Verifier: jane@co    │
    │ • Media         │         │ Source: manager      │
    │ • Reference     │         │ Message: "Great..."  │
    │ • Link          │         └──────────────────────┘
    └─────────────────┘
              │
              └─→ evidenceStrength = 0.85
                  (computed based on # and quality of proofs)
```

═════════════════════════════════════════════════════════════════════

## Dashboard Widget Data Sources

```
┌──────────────────────────────────────────────────────────────────┐
│                    DASHBOARD WIDGETS                             │
│                   (7 visualizations)                             │
└──────────────────────────────────────────────────────────────────┘
         │
         ├─ CREDIBILITY PIE
         │    Data: skills with proof_count + verification_count
         │    Segments: Verified | Proof-only | Claim-only
         │
         ├─ COVERAGE HEATMAP
         │    Data: Count skills per L1 × L2
         │    Shows: Which domains user has expertise in
         │
         ├─ RELEVANCE BARS
         │    Data: Count skills by relevance field
         │    Segments: Obsolete | Current | Emerging
         │
         ├─ RECENCY SCATTER
         │    Data: lastUsedAt vs level
         │    Shows: Recent vs rusty skills
         │
         ├─ SKILL WHEEL
         │    Data: Count skills per L1 domain (weighted)
         │    Weight: Higher if verified/proven
         │
         ├─ VERIFICATION SOURCES
         │    Data: verification_sources from requests
         │    Segments: Self | Peer | Manager | External
         │
         └─ NEXT-BEST-ACTIONS
              Data: Skills missing proofs or verifications
              Prioritizes: Low credibility → No verification → Old
```

═════════════════════════════════════════════════════════════════════

## Key Design Principles

✅ **Hierarchical:** Clear 4-level structure (L1→L2→L3→L4)
✅ **Proof-Based:** Every skill requires evidence
✅ **Curated + Flexible:** 20K curated L4s + user can create custom
✅ **Internationalized:** All names/descriptions support multiple languages
✅ **Semantic:** AI embeddings enable intelligent search
✅ **Versioned:** Schema evolution without breaking changes
✅ **Relational:** Foreign keys ensure data integrity
✅ **Computed:** Auto-calculate evidence, recency, impact scores

═════════════════════════════════════════════════════════════════════

## Summary: Is It Correct?

**YES!** ✅

The implementation matches the architecture spec:
- 6 L1 domains (U, F, T, L, M, D)
- ~220 L2 categories across all domains
- ~1,600 L3 subcategories
- ~20,000 L4 granular skills (curated)
- Proper foreign key relationships
- Proof & verification system
- Dashboard widgets with real data
- Snake_case to camelCase API mapping
- Null-safe UI components

The taxonomy is **production-ready** for the Individual Expertise Atlas! 🎉

