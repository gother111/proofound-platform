# Project Change Entry

- Date/time (UTC): 2026-02-28T09:28:04Z
- Branch: codex/pdfjs-webpack-types
- Base commit: 7f552d51
  What changed:
- Replaced internal taxonomy copy on user-facing UI surfaces from `L1/L2/L3/L4` terms to plain terms (`Domain`, `Category`, `Subcategory`, `Skill`).
- Replaced privacy labels in settings from `Tier 1/2/3` wording to `Personal`, `Sensitive`, and `Operational` (including `Operational (Pseudonymized)` for analytics).
- Updated coverage side-sheet filter descriptions to use human-readable domain/category names instead of ID-coded `L1-# / L2-#` text.
- Updated dormant but user-facing-ready components to remove internal terms (`DynamicDashboard`, `ExpertiseDepthWidget`, `TeamCoverageMatrix`, `JDMapper`, `SkillLevelRow`).
- Added/updated focused tests for plain-language terminology, including new `tests/ui/privacy-overview-copy.test.tsx`.

Why:

- PRO-98 requires removing internal terminology from user-facing copy while keeping internal backend taxonomy semantics unchanged.
- Prevent future regressions by covering both active routes and dormant components that may be re-enabled.

How to verify:

- `npm run lint` (PASS with 2 existing `@next/next/no-img-element` warnings in landing components)
- `npm run typecheck` (PASS)
- `npm run test -- tests/ui/coverage-heatmap-visibility.test.tsx tests/ui/step5-expertise-mapping.test.tsx tests/ui/add-skill-drawer-navigation.test.tsx tests/ui/add-skill-drawer-proof-verification.test.tsx tests/ui/privacy-overview-copy.test.tsx` (PASS)
- Optional grep sweep: `rg -n "L1 Domains|L2-|L1-|\\(L1\\)|\\(L2\\)|\\(L3\\)|L4 skills|Search L4 skills|Skill \\(L4\\)|Category \\(L2\\)|Tier 1|Tier 2|Tier 3" src/components src/app/app src/lib/copy --glob '**/*.{ts,tsx}'`

Open risks / TODO:

- Some internal-only comments/log lines still reference L1-L4 terminology by design; avoid converting those unless backend semantics are renamed in a dedicated task.
