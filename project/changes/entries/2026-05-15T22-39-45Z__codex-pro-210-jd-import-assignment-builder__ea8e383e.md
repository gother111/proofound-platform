# Project Change Entry

- Date/time (UTC): 2026-05-15T22:39:45Z
- Branch: codex-pro-210-jd-import-assignment-builder
- Base commit: ea8e383e
  What changed:
- Removed the unused individual `ValuesEditor` component.
- Guarded `PublicSnippetView` so causes and culture context render only for organization snippets.
- Reworded individual volunteer and impact-story form copy away from causes/values language and toward proof, concrete context, contribution, and measured outcomes.
- Cleaned unnecessary mission/values/causes fixture data from readiness/public-snippet verification tests.

Why:

- Linear PRO-195 requires Mission / Vision / Values / Causes to be removed from active individual MVP surfaces and individual matching/privacy controls, while preserving concise organization purpose/context where it supports trust or assignment clarity.

How to verify:

- `npm run test -- tests/ui/profile-skills-removal.test.tsx tests/ui/editable-profile-purpose-gating.test.tsx tests/api/profile-privacy-settings-route.test.ts tests/api/user-privacy-settings-route.test.ts tests/api/core-matching-profile-route.test.ts tests/lib/public-snippet-privacy.test.ts tests/lib/individual-readiness-state.test.ts tests/lib/verification-integrity-alignment.test.ts tests/ui/share-profile-dialog.test.tsx`
- `npm run lint`
- `npm run typecheck`
- `npm run docs:freshness`

Open risks / TODO:

- `npm run docs:freshness` remains warning-only with two pre-existing orphan-file warnings unrelated to PRO-195.
- The working tree is very broad on `codex/pro-210-jd-import-assignment-builder`; keep commit/PR isolation in mind before publishing.
