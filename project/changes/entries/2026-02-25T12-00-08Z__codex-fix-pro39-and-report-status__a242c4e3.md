# Project Change Entry

- Date/time (UTC): 2026-02-25T12:00:08Z
- Branch: codex-fix-pro39-and-report-status
- Base commit: a242c4e3
  What changed:
- Applied PRO-39 migrations directly to the configured Supabase Postgres database:
  - `src/db/migrations/20260225160000_create_skills_taxonomy_aliases.sql`
  - `src/db/migrations/20260225161000_fix_search_skills_smart_similarity_schema.sql`
  - `src/db/migrations/20260225162000_expand_taxonomy_canonical_wave.sql`
  - `src/db/migrations/20260225163000_expand_taxonomy_aliases_wave.sql`
- Fixed migration compatibility for Supabase extension schema:
  - Updated trigram index opclasses to `extensions.gin_trgm_ops` in `20260225160000_create_skills_taxonomy_aliases.sql`.
- Fixed alias-wave selection behavior in `scripts/taxonomy-build-alias-wave.ts`:
  - collision resolution now keeps one deterministic winner per `alias_norm` with source-priority (`curated` first) instead of dropping all collided aliases.
- Regenerated and reapplied alias wave migration to restore required alias terms (notably `aws`).

Why:

- Full verification required live DB state with alias/canonical migrations applied.
- Initial verification found one practical gap (`aws` alias missing) despite broad coverage; deterministic collision winner logic prevents curated alias loss in future waves.

How to verify:

- `npm run db:backup:checkpoint` (PASS, checkpoint created)
- Direct apply of four PRO-39 migrations via `pg` client script (PASS)
- `npx tsx scripts/check-skills-data.ts` (PASS, active skills = `19,752`)
- `npm run taxonomy:validate:aliases` (PASS, active aliases = `14,367`, collisions = `0`, missing required terms = `0`)
- `npx tsx scripts/check-taxonomy-coverage.ts` (PASS)
- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test -- tests/api/expertise-taxonomy-route.test.ts src/app/app/i/expertise/components/add-skill/api.test.ts` (PASS)
- Live RPC checks using `search_skills_smart` (PASS):
  - `swedish` -> `Swedish language proficiency` (`exact_alias`)
  - `dockr` -> `Docker` (`fuzzy_canonical`)
  - `gh actions` -> `GitHub Actions` (`exact_alias`)
  - `gcp` -> `Google Cloud Platform` (`exact_alias`)
  - `aws` -> `Amazon Web Services` (`exact_alias`)
  - `kubernetes` -> `Kubernetes` (`exact_canonical`)
  - `ukrainian` -> `Ukrainian language proficiency` (`exact_alias`)
  - `talent management` -> `Talent management` (`exact_canonical`)

Open risks / TODO:

- Migration application here was performed directly and not through `app_migration_ledger`; if you need full ledger consistency in this environment, run a ledger reconciliation step.
- Keep monthly alias-wave runs using the updated collision winner logic to protect curated acronyms.
