# Project Change Entry

- Date/time (UTC): 2026-02-22T21:54:16Z
- Branch: codex-review-expertise-hub-documentation
- Base commit: d3a3691c
  What changed:
- Canonicalized assignment expertise persistence around `assignment_expertise_matrix`:
  - Added shared mapper utilities in `src/lib/assignments/expertise-matrix.ts`.
  - Synced assignment create/update and matrix API routes to derive compatibility JSON skill arrays from matrix rows.
  - Updated org assignment builder Step 5 matrix payload roles to `must` and `nice`.
- Updated matching read paths to prefer matrix-derived requirements:
  - `src/lib/core/matching/assignmentMatcher.ts`
  - `src/app/api/core/matching/profile/route.ts`
- Updated individual matching profile behavior:
  - Deprecated `skills` writes in `src/app/api/core/matching/matching-profile/route.ts` and ignore by default unless `MATCHING_PROFILE_ENABLE_SKILL_WRITES=true`.
- Migrated gap analysis strategy:
  - Fixed schema mismatch in `src/lib/skills/gap-service.ts` to use `required_level`, `stakeholder_role`, `linked_outcome_id`.
  - Replaced `src/app/api/expertise/gap-analysis/route.ts` with a compatibility wrapper over canonical `computeSkillGaps`.
  - Updated dashboard/readiness widgets to use `/api/skill-gaps` and route users to `/app/i/skill-gaps`.
- Simplified expertise UX:
  - Refactored `src/components/matching/MatchingProfileSetup.tsx` to Atlas-as-source flow and removed skill authoring from setup payload.
  - Removed hard reload behavior from expertise surfaces (`ExpertiseAtlasClient`, legacy `GapMap` retry).
  - Reworded proof visibility copy in expertise cards.
- Added docs route and updated docs:
  - Added `src/app/docs/expertise-atlas/page.tsx`.
  - Updated links in `src/app/app/i/expertise/components/AboutSection.tsx` and `src/app/app/i/expertise/ExpertiseAtlasClient.tsx`.
  - Rewrote `docs/EXPERTISE_ATLAS_SETUP.md` with current endpoints and migration guidance.
- Updated scripts/mocks for current matrix schema:
  - `scripts/smoke-skill-gaps.ts`
  - `scripts/seed-prd-flows.ts`

Why:

- Align individual and org expertise flows with one source of truth per domain:
  - Atlas for individual skills
  - Canonical skill-gaps service for gap analysis
  - `assignment_expertise_matrix` for assignment requirements
- Reduce duplicate skill maintenance and route drift.
- Preserve backward compatibility while enabling staged legacy cleanup.

How to verify:

- `npm run lint` (pass)
- `npm run typecheck` (pass)
- `npm run test -- tests/ui/step5-expertise-mapping.test.tsx tests/api/matching-profile-compat-route.test.ts src/lib/__tests__/gap-service.test.ts` (pass)
- `npm run build` (pass)
- `npm run docs:freshness` (pass with existing warnings only)

Open risks / TODO:

- Deprecated compatibility routes remain active and should be removed only after telemetry confirms low usage:
  - `/api/expertise/gap-analysis`
  - matching-profile `skills` writes
- Existing non-migrated links still exist outside expertise surfaces (example: feedback helper links to `/profile/*` paths) and should be handled in a separate cleanup pass.
