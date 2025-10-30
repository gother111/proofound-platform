# Expertise Atlas Setup Guide

## Overview

This guide explains how to set up the Expertise Atlas taxonomy system with 20K+ skills across 6 major domains.

## Database Schema

### Taxonomy Structure

The Expertise Atlas uses a 4-level hierarchical taxonomy:

- **L1 (6 domains)**: Universal Capabilities, Functional Competencies, Tools & Technologies, Languages & Culture, Methods & Practices, Domain Knowledge
- **L2 (~150 categories)**: Major categories within each L1 (e.g., Communication, Programming, etc.)
- **L3 (~500 subcategories)**: Specific areas within each L2 (e.g., Verbal communication, Python programming, etc.)
- **L4 (~20,000 skills)**: Granular skills that users add to their profiles

### L1 Domain Mapping

| Code | Domain Name | Cat ID | Icon |
|------|-------------|--------|------|
| U | Universal Capabilities | 1 | U |
| F | Functional Competencies | 2 | F |
| T | Tools & Technologies | 3 | T |
| L | Languages & Culture | 4 | L |
| M | Methods & Practices | 5 | M |
| D | Domain Knowledge | 6 | D |

## Setup Instructions

### 1. Run the Migration

First, apply the taxonomy migration to create/update the tables:

```bash
# This migration updates L1 domains and adds relevance field
npm run db:push
```

The migration will:
- ✅ Update the 6 L1 domains with correct names (U/F/T/L/M/D)
- ✅ Add `relevance` field to skills table (obsolete/current/emerging)
- ✅ Create helper functions for taxonomy queries

### 2. Seed the Taxonomy

Run the seeding script to populate all L2, L3, and L4 data:

```bash
npm run db:seed-taxonomy
```

This will:
- ✅ Parse L2/L3 from `Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md`
- ✅ Insert all L2 categories (~150 items)
- ✅ Insert all L3 subcategories (~500 items)
- ✅ Import 19,936 L4 skills from `data/expertise-atlas-20k-l4-final.json`

**Expected output:**
```
📦 Seeding L2 categories...
✅ Inserted 150 L2 categories

📦 Seeding L3 subcategories...
✅ Inserted 500 L3 subcategories

📦 Seeding L4 skills...
Found 19936 skills to insert
   Progress: 5000 / 19936 skills inserted...
   Progress: 10000 / 19936 skills inserted...
   Progress: 15000 / 19936 skills inserted...

✅ L4 Seeding complete:
   - Inserted: 19936
   - Skipped: 0
   - Errors: 0

🎉 Taxonomy seeding completed successfully!
```

### 3. Verify the Data

Check that the taxonomy was loaded correctly:

```sql
-- Count L1 domains (should be 6)
SELECT COUNT(*) FROM skills_categories;

-- Count L2 categories (should be ~150)
SELECT COUNT(*) FROM skills_subcategories;

-- Count L3 subcategories (should be ~500)
SELECT COUNT(*) FROM skills_l3;

-- Count L4 skills (should be ~20K)
SELECT COUNT(*) FROM skills_taxonomy;

-- View distribution by L1
SELECT 
  c.name_i18n->>'en' as domain,
  COUNT(st.code) as skill_count
FROM skills_categories c
LEFT JOIN skills_taxonomy st ON st.cat_id = c.cat_id
GROUP BY c.cat_id, c.name_i18n
ORDER BY c.cat_id;
```

**Expected distribution:**
- U (Universal Capabilities): ~2,688 skills
- F (Functional Competencies): ~5,040 skills
- T (Tools & Technologies): ~3,920 skills
- L (Languages & Culture): ~1,568 skills
- M (Methods & Practices): ~3,248 skills
- D (Domain Knowledge): ~3,472 skills

## Database Tables

### `skills_categories` (L1)
- `cat_id`: 1-6 (fixed)
- `slug`: Unique identifier (e.g., "universal-capabilities")
- `name_i18n`: Multilingual name (JSON)
- `icon`: Single letter code (U/F/T/L/M/D)

### `skills_subcategories` (L2)
- `cat_id`: Foreign key to L1
- `subcat_id`: Sequential within L1
- `slug`: Unique identifier
- `name_i18n`: Multilingual name

### `skills_l3` (L3)
- `cat_id`, `subcat_id`: Foreign key to L2
- `l3_id`: Sequential within L2
- `slug`: Unique identifier
- `name_i18n`: Multilingual name

### `skills_taxonomy` (L4)
- `code`: Unique code format "01.003.005.00142"
- `cat_id`, `subcat_id`, `l3_id`: Foreign keys to L3
- `skill_id`: Sequential number
- `slug`: Unique identifier
- `name_i18n`: Multilingual name
- `aliases_i18n`: Alternative names
- `tags`: Searchable tags
- `status`: active/deprecated/merged

### `skills` (User skills)
- `profile_id`: User who has this skill
- `skill_code`: Foreign key to L4 code
- `level`: 0-5 (proficiency)
- `competency_label`: C1-C5 (auto-mapped from level)
- `relevance`: obsolete/current/emerging
- `last_used_at`: When skill was last used
- `evidence_strength`: 0-1 (computed from verifications)
- `recency_multiplier`: 0-1 (computed from projects)
- `impact_score`: 0-1 (computed from project outcomes)

## API Endpoints (To Be Created)

### Taxonomy Queries
- `GET /api/expertise/taxonomy` - Get full hierarchy
- `GET /api/expertise/taxonomy/l1` - Get L1 domains
- `GET /api/expertise/taxonomy/l2?l1={code}` - Get L2 for L1
- `GET /api/expertise/taxonomy/l3?l2={code}` - Get L3 for L2
- `GET /api/expertise/taxonomy/l4?l3={id}` - Get L4 for L3
- `GET /api/expertise/taxonomy/search?q={query}` - Search skills

### User Skills
- `GET /api/expertise/user-skills` - Get user's L4 entries
- `POST /api/expertise/skills` - Add new L4 to user's profile
- `PATCH /api/expertise/skills/:id` - Update L4 attributes
- `DELETE /api/expertise/skills/:id` - Remove L4 from profile

### Dashboard
- `GET /api/expertise/dashboard` - Get aggregated metrics for widgets

## Troubleshooting

### "Table already exists" errors
If you see duplicate key errors, the taxonomy may have been partially seeded. You can:

```sql
-- Clear all taxonomy data (DESTRUCTIVE!)
TRUNCATE TABLE skills_taxonomy CASCADE;
TRUNCATE TABLE skills_l3 CASCADE;
TRUNCATE TABLE skills_subcategories CASCADE;
TRUNCATE TABLE skills_categories CASCADE;
```

Then re-run the seeding script.

### Missing environment variables
Ensure these are set in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Parsing errors
If the seed script fails to parse taxonomy files, check that:
- `Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md` exists in project root
- `data/expertise-atlas-20k-l4-final.json` exists

## Next Steps

After seeding the taxonomy:

1. ✅ **Phase 1 Complete** - Schema and data ready
2. 🔄 **Phase 2** - Build UI components (L1 grid, L2 modal, etc.)
3. 🔄 **Phase 3** - Add skill drawer flow
4. 🔄 **Phase 4** - Dashboard widgets (7 visualizations)
5. 🔄 **Phase 5** - Proof & verification UI
6. 🔄 **Phase 6** - Polish & Figma alignment

## Data Sources

- **L1/L2/L3**: `Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md`
- **L4 Skills**: `data/expertise-atlas-20k-l4-final.json`
- **Documentation**: `Expertise_Atlas_Product_Documentation_For_Individuals.md`

