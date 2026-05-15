# Project Change Entry

- Date/time (UTC): 2026-05-15T20:44:39Z
- Branch: codex-pro-188-first-proof-verification
- Base commit: cd7949f5
  What changed:
- Converted `/api/profile/completeness` to a legacy 410 response that points callers to `/api/individual/readiness`.
- Removed individual profile completeness percentage/progress UI from the dashboard/profile surfaces and replaced it with proof-readiness checklist language.
- Removed the individual cover/banner image upload component from the active profile surface and ignored individual `coverImage` updates.
- Updated focused tests and E2E helpers away from profile-completion percentage assertions.
- Updated API docs and launch-surface inventory so the legacy route is archived rather than active.

Why:

- PRO-192 requires the MVP to avoid profile theater and use proof/trust readiness instead of profile-completion scoring or individual banner imagery.

How to verify:

- `npm run test -- tests/api/profile-completeness-legacy-route.test.ts tests/api/launch-surface-inventory.test.ts tests/ui/dashboard-status-chip-style.test.tsx tests/ui/editable-profile-purpose-gating.test.tsx tests/lib/verification-integrity-alignment.test.ts tests/routes/onboarding-page.test.ts tests/ui/individual-setup-proof-first.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run docs:freshness`

Open risks / TODO:

- `docs:freshness` still reports two pre-existing warning-mode orphan files outside this change scope.
