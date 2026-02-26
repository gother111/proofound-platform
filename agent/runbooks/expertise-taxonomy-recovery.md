> Doc Class: `active`
> Last Verified: `2026-02-26`

# Expertise Taxonomy Recovery Runbook

## Purpose

Recover Expertise Atlas taxonomy data when Add Skill search/browse is empty or dashboard taxonomy context is missing.

## Scope

- Restores L1-L4 taxonomy records in:
  - `skills_categories`
  - `skills_subcategories`
  - `skills_l3`
  - `skills_taxonomy`
- Optionally backfills `skills.skill_code` for custom rows where mapping is unambiguous.

## Preconditions

- `.env.local` contains:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Source files exist:
  - `src/db/migrations/20250131_seed_taxonomy_l1_l2_l3.sql`
  - `data/expertise-atlas-20k-l4-final.json`
  - `Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md` or `docs/archive/legacy-platform/Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md`

## Recovery Steps

1. Precheck only:

```bash
npx tsx scripts/repair-expertise-taxonomy.ts --dry-run
```

2. Apply recovery (creates snapshots before writes):

```bash
npx tsx scripts/repair-expertise-taxonomy.ts --apply
```

3. Review custom skill-code backfill (safe preview):

```bash
npx tsx scripts/backfill-skill-codes.ts --dry-run
```

4. Apply backfill (only unique confident matches):

```bash
npx tsx scripts/backfill-skill-codes.ts --apply
```

5. Validate taxonomy data:

```bash
set -a; source .env.local >/dev/null 2>&1; set +a
npx tsx scripts/check-skills-data.ts
```

6. Validate API behavior:

```bash
# Example local checks with dev server running
curl "http://127.0.0.1:4100/api/expertise/taxonomy?l1=U"
curl "http://127.0.0.1:4100/api/expertise/taxonomy?search=python"
```

Expected:

- L2 list for `l1=U` is non-empty.
- L4 search list for `search=python` is non-empty.

## Snapshots and Rollback

- Recovery apply exports table snapshots to `output/` as JSON and CSV.
- Snapshot files are timestamped per run, for example:
  - `output/skills_taxonomy-<timestamp>.json`
  - `output/skills-<timestamp>.json`

Rollback approach:

- Use snapshot files as restore source for affected tables.
- Revert `skills.skill_code` updates using backfill report files:
  - `output/skill-code-backfill-report-<timestamp>.json`

## Common Pitfalls

- Supabase `select()` defaults to 1000 rows. Recovery/backfill scripts must paginate full-table reads.
- `search_skills_smart` can return zero rows when search vectors lag. Taxonomy API should fall back to direct `ILIKE` search for reliability.
- `scripts/check-skills-data.ts` requires env vars in process environment when run directly.
