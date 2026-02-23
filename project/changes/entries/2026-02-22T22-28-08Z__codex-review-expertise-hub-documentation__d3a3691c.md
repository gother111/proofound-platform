# Project Change Entry

- Date/time (UTC): 2026-02-22T22:28:08Z
- Branch: codex-review-expertise-hub-documentation
- Base commit: d3a3691c

What changed:

- Added PRD parity implementation for I-15 and A7:
- Added migration `src/db/migrations/20260222123000_add_matching_profile_focus_fields.sql` and schema fields on `matching_profiles` (`desired_roles`, `desired_industries`, `org_types`).
- Added shared eligibility evaluator in `src/lib/matching/eligibility.ts` and enforced hard `412 PROFILE_NOT_MATCHABLE` gates in:
- `src/app/api/core/matching/profile/route.ts`
- `src/app/api/core/matching/near-matches/route.ts`
- Added focus soft-boost scoring helper `src/lib/core/matching/focus.ts` and applied boost in profile and near-matches scoring paths with explainability metadata.
- Updated matching setup wizard `src/components/matching/MatchingProfileSetup.tsx` with dedicated `Focus & Weights` step, mission-vs-skills slider, focus area inputs, and payload wiring.
- Updated focus area UI values in `src/components/matching/FocusAreasSection.tsx` to canonical lowercase enums.
- Extended profile persistence routes to accept/return focus fields:
- `src/app/api/core/matching/matching-profile/route.ts`
- `src/app/api/matching/profile/route.ts`
- `src/app/api/matching/profile/[id]/route.ts`
- Added blocked-state UI handling for 412 in `src/app/app/i/matching/page.tsx`.
- Added new analytics event types in `src/lib/analytics/constants.ts` and emitted events for:
- `matching_focus_updated`
- `matching_weight_bias_changed`
- `matching_gated_not_matchable`
- Added tests:
- `src/lib/__tests__/matching-eligibility.test.ts`
- `src/lib/__tests__/matching-focus.test.ts`
- `src/lib/__tests__/matching-presets-bias.test.ts`
- `tests/api/core-matching-gating-routes.test.ts`
- `tests/api/core-matching-profile-route.test.ts`
- `tests/api/matching-profile-compat-route.test.ts` (expanded)
- `tests/ui/matching-page-gated.test.tsx`
- `tests/ui/matching-profile-setup-focus.test.tsx`
- Updated `docs/EXPERTISE_ATLAS_SETUP.md` with I-15/A7 behavior and API notes.

Why:

- Align matching setup and activation behavior with PRD requirements:
- Dedicated focus + weighting UX in main setup flow.
- Strict matchable gating before generating matches.
- Canonical persistence for focus areas and transparent focus-based ranking lift.

How to verify:

- `npm run test -- src/lib/__tests__/matching-presets-bias.test.ts src/lib/__tests__/matching-focus.test.ts src/lib/__tests__/matching-eligibility.test.ts tests/api/core-matching-gating-routes.test.ts tests/api/core-matching-profile-route.test.ts tests/api/matching-profile-compat-route.test.ts tests/ui/matching-page-gated.test.tsx tests/ui/matching-profile-setup-focus.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Open risks / TODO:

- Legacy routes and pre-existing dirty-branch files outside this scope still need separate cleanup/migration follow-up.
- Focus role matching currently uses normalized text containment; taxonomy-backed role matching can improve precision later.
- Build warns about missing deploy env vars in local prebuild readiness check; build still completes in this workspace.
