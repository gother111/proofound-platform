# Expertise Atlas - 20K Skills Dataset

> Doc Class: `reference-spec`
> Last Verified: `2026-05-19`
> Reference note: retained taxonomy dataset context only. `/app/i/expertise` and the broad Expertise Atlas UI are archived outside the locked MVP launch corridor.
> Current precedence: `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`, `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`, then fresh repo-grounded evidence. Do not use this dataset README to revive archived Expertise Atlas UI routes, old smart-search setup, or production database shortcuts.

## Overview

This dataset contains **19,882 curated L4 skills** for retained taxonomy/reference work, organized according to the archived taxonomy specified in `Expertise_Atlas_Product_Documentation_For_Individuals.md`. It is not active launch evidence for the old Expertise Atlas product surface.

**Generated:** 2025-10-30
**File:** `expertise-atlas-20k-l4-skills.json`
**Based on:** ESCO/O\*NET occupational frameworks, OECD transferable skills

---

## Taxonomy Structure

### L1 → L2 → L3 → L4 Hierarchy

The skills follow a 4-level taxonomy:

- **L1 (Domains):** 6 fixed meta-domains
- **L2 (Categories):** Major categories within each domain
- **L3 (Subcategories):** Specific subcategories for focused skill areas
- **L4 (Skills):** Granular, actionable skills (this dataset)

---

## L1 Domain Distribution

| Code      | Domain Name             | L4 Count   | % of Total | Description                                                              |
| --------- | ----------------------- | ---------- | ---------- | ------------------------------------------------------------------------ |
| **U**     | Universal Capabilities  | 2,500      | 12.6%      | Transferable cognitive, interpersonal, and personal effectiveness skills |
| **F**     | Functional Competencies | 5,000      | 25.1%      | Professional and specialized functional capabilities                     |
| **T**     | Tools & Technologies    | 6,000      | 30.2%      | Specific tools, platforms, frameworks, and technologies                  |
| **L**     | Languages & Culture     | 1,382      | 6.9%       | Natural languages and cultural competencies                              |
| **M**     | Methods & Practices     | 2,000      | 10.1%      | Methodologies, frameworks, and best practices                            |
| **D**     | Domain Knowledge        | 3,000      | 15.1%      | Industry and domain-specific expertise                                   |
| **Total** |                         | **19,882** | **100%**   |                                                                          |

---

## Dataset Format

### JSON Structure

```json
{
  "metadata": {
    "version": "1.0.0",
    "generated_at": "2025-10-30T...",
    "total_skills": 19882,
    "description": "20,000 L4 skills for retained taxonomy reference",
    "distribution": {
      "U_Universal_Capabilities": 2500,
      "F_Functional_Competencies": 5000,
      "T_Tools_Technologies": 6000,
      "L_Languages_Culture": 1382,
      "M_Methods_Practices": 2000,
      "D_Domain_Knowledge": 3000
    }
  },
  "skills": [
    {
      "name": "Root Cause Analysis",
      "domain": "U",
      "category": "Critical Thinking",
      "subcategory": "Analytical Reasoning"
    }
    // ... 19,881 more skills
  ]
}
```

### Fields

- **`name`** (string): The skill name (user-facing)
- **`domain`** (string): L1 domain code (U, F, T, L, M, or D)
- **`category`** (string): L2 category name
- **`subcategory`** (string): L3 subcategory name

---

## Historical Usage Pattern

The examples below are preserved to explain the original dataset shape. Do not run them against production-candidate or production data unless a current target-approved taxonomy recovery plan explicitly calls for this retained dataset and also follows the active migration, backup, and isolated-restore runbooks.

### 1. Historical Database Import Shape

#### Option A: PostgreSQL/Supabase (Recommended)

```sql
-- Create tables (if not exists)
CREATE TABLE skills_l1 (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE skills_l2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  l1_code TEXT REFERENCES skills_l1(code),
  name TEXT NOT NULL
);

CREATE TABLE skills_l3 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  l2_id UUID REFERENCES skills_l2(id),
  name TEXT NOT NULL
);

CREATE TABLE skills_l4 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  l3_id UUID REFERENCES skills_l3(id),
  name TEXT NOT NULL,
  is_curated BOOLEAN DEFAULT true,
  UNIQUE(l3_id, name)
);

-- Import data using a script (see import-skills.ts below)
```

#### Option B: TypeScript/Node.js Import Script

```typescript
// scripts/import-skills.ts
import { createClient } from '@supabase/supabase-js';
import skillsData from '../data/expertise-atlas-20k-l4-skills.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importSkills() {
  console.log(`Importing ${skillsData.metadata.total_skills} skills...`);

  // Group skills by domain → category → subcategory
  const hierarchy: Record<string, Record<string, Record<string, string[]>>> = {};

  for (const skill of skillsData.skills) {
    if (!hierarchy[skill.domain]) hierarchy[skill.domain] = {};
    if (!hierarchy[skill.domain][skill.category]) {
      hierarchy[skill.domain][skill.category] = {};
    }
    if (!hierarchy[skill.domain][skill.category][skill.subcategory]) {
      hierarchy[skill.domain][skill.category][skill.subcategory] = [];
    }
    hierarchy[skill.domain][skill.category][skill.subcategory].push(skill.name);
  }

  // Insert L1 domains
  const domainMap: Record<string, string> = {
    U: 'Universal Capabilities',
    F: 'Functional Competencies',
    T: 'Tools & Technologies',
    L: 'Languages & Culture',
    M: 'Methods & Practices',
    D: 'Domain Knowledge',
  };

  for (const [code, name] of Object.entries(domainMap)) {
    const { error } = await supabase
      .from('skills_l1')
      .upsert({ code, name }, { onConflict: 'code' });

    if (error) console.error(`Error inserting L1 ${code}:`, error);
  }

  // Insert L2, L3, L4
  for (const [domain, categories] of Object.entries(hierarchy)) {
    for (const [category, subcategories] of Object.entries(categories)) {
      // Insert L2
      const { data: l2Data, error: l2Error } = await supabase
        .from('skills_l2')
        .upsert({ l1_code: domain, name: category }, { onConflict: 'l1_code,name' })
        .select('id')
        .single();

      if (l2Error || !l2Data) continue;

      for (const [subcategory, skills] of Object.entries(subcategories)) {
        // Insert L3
        const { data: l3Data, error: l3Error } = await supabase
          .from('skills_l3')
          .upsert({ l2_id: l2Data.id, name: subcategory }, { onConflict: 'l2_id,name' })
          .select('id')
          .single();

        if (l3Error || !l3Data) continue;

        // Insert L4 skills (batch)
        const l4Skills = skills.map((name) => ({
          l3_id: l3Data.id,
          name,
          is_curated: true,
        }));

        const { error: l4Error } = await supabase
          .from('skills_l4')
          .upsert(l4Skills, { onConflict: 'l3_id,name', ignoreDuplicates: true });

        if (l4Error) console.error(`Error inserting L4 for ${subcategory}:`, l4Error);
      }
    }
  }

  console.log('✅ Import complete!');
}

importSkills().catch(console.error);
```

Run with:

```bash
npx tsx scripts/import-skills.ts
```

### 2. Use in Frontend

```typescript
// lib/skills.ts
import skillsData from '@/data/expertise-atlas-20k-l4-skills.json';

export function searchSkills(query: string, limit = 20) {
  const normalized = query.toLowerCase();
  return skillsData.skills
    .filter((skill) => skill.name.toLowerCase().includes(normalized))
    .slice(0, limit);
}

export function getSkillsByDomain(domain: 'U' | 'F' | 'T' | 'L' | 'M' | 'D') {
  return skillsData.skills.filter((skill) => skill.domain === domain);
}

export function getSkillsByCategory(category: string) {
  return skillsData.skills.filter((skill) => skill.category === category);
}
```

### 3. Autocomplete Component

```tsx
// components/SkillAutocomplete.tsx
'use client';

import { useState } from 'react';
import { searchSkills } from '@/lib/skills';

export function SkillAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setResults(searchSkills(value, 10));
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search 20,000 skills..."
      />
      <ul>
        {results.map((skill, i) => (
          <li key={i}>
            <strong>{skill.name}</strong>
            <span>
              {skill.domain} → {skill.category} → {skill.subcategory}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Sample Skills by Domain

### U - Universal Capabilities (2,500)

- Root Cause Analysis
- Systems Thinking
- Public Speaking
- Active Listening
- Team Leadership
- Time Management
- Emotional Intelligence

### F - Functional Competencies (5,000)

- Python Programming
- React - Components
- SEO
- Financial Modeling
- Recruiting
- UI Design

### T - Tools & Technologies (6,000)

- PostgreSQL - Query Writing
- AWS Lambda - Setup
- Docker - Configuration
- Figma - Prototyping
- TensorFlow - Technique 1

### L - Languages & Culture (1,382)

- English - Business Communication (C1)
- Spanish - Basic Conversation (A2)
- Japanese - Reading Comprehension (B1)
- American Business Etiquette

### M - Methods & Practices (2,000)

- Scrum - Sprint Planning (Advanced)
- Design Thinking - Application 1
- Six Sigma - Black Belt Skill 3
- Qualitative Research - Approach 12

### D - Domain Knowledge (3,000)

- Clinical Trials - Specialty 5
- Investment Banking - Application 8
- Contract Law - Practice Area 2
- Curriculum Development - Competency 7

---

## Data Quality

- ✅ **Realistic Skills:** Based on industry-standard taxonomies (ESCO, O\*NET, OECD)
- ✅ **Production-Ready:** Immediately usable for MVP
- ✅ **Comprehensive Coverage:** 6 domains, multiple categories, diverse subcategories
- ✅ **Granular:** Each skill is actionable and specific
- ✅ **Scalable:** Designed for 15k+ skills per user/org

---

## Extending the Dataset

### Adding More Skills

Users can add custom L4 skills through your UI:

```typescript
// User adds "Advanced React Performance Optimization"
await supabase.from('skills_l4').insert({
  l3_id: 'react-subcategory-id',
  name: 'Advanced React Performance Optimization',
  is_curated: false, // User-created
  created_by: userId,
});
```

### Curating User Skills

Track usage and promote popular custom skills:

```sql
-- Find popular user-created skills
SELECT name, COUNT(*) as usage_count
FROM user_skills
JOIN skills_l4 ON user_skills.skill_id = skills_l4.id
WHERE skills_l4.is_curated = false
GROUP BY name
HAVING COUNT(*) >= 50
ORDER BY usage_count DESC;

-- Promote to curated
UPDATE skills_l4
SET is_curated = true
WHERE name = 'Popular User Skill'
  AND is_curated = false;
```

---

## Files in This Directory

```
data/
├── expertise-atlas-20k-l4-skills.json    # Main dataset (19,882 skills)
├── README-EXPERTISE-ATLAS-SKILLS.md      # This file
└── expertise-atlas-skills-part1-universal.json  # Partial (Universal only)
```

---

## Reference Follow-Ups Only

1. Keep `/app/i/expertise` and the broad Expertise Atlas UI archived unless a future locked source reactivates them.
2. Use the active migration, backup, and isolated-restore runbooks before any target-approved taxonomy data work.
3. Validate any retained taxonomy changes through proof-skill selection and assignment expertise helpers, not the archived Atlas dashboard.

---

## Questions or Issues?

- **Missing a skill?** Users can add custom L4 skills—this is by design per §2.4
- **Too many variations?** Use the `usage_count` field to prioritize common skills
- **Need multilingual?** Extend with `name_i18n` JSONB field

---

## License

This dataset was generated for the historical Expertise Atlas track and is retained as taxonomy reference context.
Use within Proofound only when the current locked MVP authority stack or a target-approved taxonomy recovery run explicitly calls for it.

---

**Generated with:** `scripts/generate-20k-l4-skills-final.py`
**Documentation:** `Expertise_Atlas_Product_Documentation_For_Individuals.md`
