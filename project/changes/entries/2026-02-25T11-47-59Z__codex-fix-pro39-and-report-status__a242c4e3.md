# Project Change Entry

- Date/time (UTC): 2026-02-25T11:47:59Z
- Branch: codex-fix-pro39-and-report-status
- Base commit: a242c4e3
  What changed:
- Added alias-table architecture and reliability migrations for PRO-39:
  - `src/db/migrations/20260225160000_create_skills_taxonomy_aliases.sql`
  - `src/db/migrations/20260225161000_fix_search_skills_smart_similarity_schema.sql`
  - `src/db/migrations/20260225162000_expand_taxonomy_canonical_wave.sql`
  - `src/db/migrations/20260225163000_expand_taxonomy_aliases_wave.sql`
- Added broad taxonomy build and quality scripts:
  - `scripts/taxonomy-wave-config.ts`
  - `scripts/taxonomy-build-canonical-wave.ts`
  - `scripts/taxonomy-build-alias-wave.ts`
  - `scripts/taxonomy-validate-alias-quality.ts`
  - `scripts/taxonomy-report-search-misses.ts`
  - `scripts/check-taxonomy-coverage.ts`
- Updated taxonomy API search reliability in `src/app/api/expertise/taxonomy/route.ts`:
  - explicit RPC failure handling
  - alias-aware fallback ranking
  - privacy-safe search telemetry (`query_hash`, `query_class`) on zero-result and error outcomes.
- Updated add-skill API client error handling in `src/app/app/i/expertise/components/add-skill/api.ts` to throw on non-OK search responses.
- Added focused tests:
  - `tests/api/expertise-taxonomy-route.test.ts`
  - `src/app/app/i/expertise/components/add-skill/api.test.ts`
- Added npm scripts in `package.json`:
  - `test:taxonomy:coverage`
  - `taxonomy:build:canonical`
  - `taxonomy:build:aliases`
  - `taxonomy:validate:aliases`
  - `taxonomy:report:search-misses`
- Updated `scripts/check-skills-data.ts` to load `.env.local` so verification works without manual shell export.
- Posted implementation and verification summary on Linear issue `PRO-39`.

Why:

- Fixes the search reliability failure where smart search could break on `similarity()` resolution and the UI silently showed empty state.
- Broadens taxonomy discoverability using canonical skills plus a scalable alias table with collision safety.
- Introduces deterministic generation and quality gates for future monthly taxonomy updates.

How to verify:

- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test -- tests/api/expertise-taxonomy-route.test.ts src/app/app/i/expertise/components/add-skill/api.test.ts` (PASS)
- `npx tsx scripts/check-skills-data.ts` (PASS)
- `npm run taxonomy:build:canonical` (PASS)
- `npm run taxonomy:build:aliases` (PASS)
- `npm run taxonomy:report:search-misses -- --days 30 --top 10` (PASS)
- `npx tsx scripts/check-taxonomy-coverage.ts` (FAIL before migrations are applied to DB, alias table missing)
- `npm run taxonomy:validate:aliases` (FAIL before migrations are applied to DB, alias table missing)

Open risks / TODO:

- Apply migrations to target DB and rerun coverage + alias quality checks.
- Monitor telemetry events `taxonomy_search_zero_results` and `taxonomy_search_error` after deploy for ranking tuning.
