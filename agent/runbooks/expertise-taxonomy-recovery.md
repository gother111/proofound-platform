> Doc Class: `active`
> Last Verified: `2026-05-19`

# Expertise Taxonomy Recovery Runbook

## Purpose

Recover retained taxonomy data when proof-skill selection, assignment expertise helpers, or retained taxonomy APIs are empty. This is not a runbook for restoring the archived `/app/i/expertise` UI or broad Expertise Atlas dashboard.

## Scope

- Restores L1-L4 taxonomy records in:
  - `skills_categories`
  - `skills_subcategories`
  - `skills_l3`
  - `skills_taxonomy`
- Optionally backfills `skills.skill_code` for custom rows where mapping is unambiguous.

## Preconditions

- A target is explicit and approved.
- Required environment variables exist in the selected operator context, without printing values:
  - `DATABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- For production-candidate or production targets, capture the current backup/checkpoint and confirm the isolated restore rehearsal path before applying recovery.
- Source files exist:
  - `src/db/migrations/20250131_seed_taxonomy_l1_l2_l3.sql`
  - `data/expertise-atlas-20k-l4-final.json`
  - `Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md` or `docs/archive/legacy-platform/Expertise_Atlas_Taxonomy_L1_L2_L3_Expanded.md`

Do not use this runbook to run `db:push`, paste ad-hoc SQL into production, or revive archived Expertise Atlas UI routes.

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
- `/app/i/expertise` remains archived/unavailable under route-surface policy.

## Snapshots and Rollback

- Recovery apply exports table snapshots to `output/` as JSON and CSV.
- Snapshot files are timestamped per run, for example:
  - `output/skills_taxonomy-<timestamp>.json`
  - `output/skills-<timestamp>.json`

Rollback approach:

- Use snapshot files as restore source for affected tables.
- Revert `skills.skill_code` updates using backfill report files:
  - `output/skill-code-backfill-report-<timestamp>.json`
- For production-candidate or production targets, preserve the recovery evidence with the launch artifact and do not treat taxonomy API recovery as final go/no-go evidence by itself.

## Common Pitfalls

- Supabase `select()` defaults to 1000 rows. Recovery/backfill scripts must paginate full-table reads.
- `search_skills_smart` can return zero rows when search vectors lag. Taxonomy API should fall back to direct `ILIKE` search for reliability.
- `scripts/check-skills-data.ts` requires env vars in process environment when run directly.
