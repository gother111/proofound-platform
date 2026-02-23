# Project Change Entry

- Date/time (UTC): 2026-02-23T07:15:20Z
- Branch: codex-assess-prd-complexity-cliffs
- Base commit: d3a3691c
  What changed:
- Added server-side feature flag evaluation and authenticated web flag bootstrap:
  - `src/lib/feature-flags/server.ts`
  - `src/app/api/feature-flags/route.ts`
  - `src/lib/featureFlags.ts` (keys + client defaults)
- Wired feature flags into core behavior:
  - Activation tiering gate in `src/lib/matching/eligibility.ts` and `src/app/api/expertise/stats/route.ts`
  - Assignment Basic-mode gate in `src/app/api/assignments/route.ts` and `src/app/api/assignments/[id]/publish/route.ts`
- Completed live org builder-mode UX in actual production page:
  - `src/app/app/o/[slug]/assignments/new/page.tsx`
  - Added Basic/Advanced mode selector, step skipping, mode-specific validation, mode analytics payloads, and `builderMode` persistence.
- Completed SLA preset support in scheduling flow:
  - API validation and duration/preset handling in `src/app/api/interviews/schedule/route.ts`
  - UI preset + duration selection in `src/components/interviews/InterviewScheduler.tsx`
  - Hook payload support in `src/hooks/useInterviewScheduling.ts`
- Standardized empty-state remediation actions (3 deep-linked actions) across core surfaces:
  - Atlas: `src/app/app/i/expertise/components/EmptyState.tsx`
  - Matching (individual): `src/components/matching/IndividualMatchingEmpty.tsx`
  - Matching (organization): `src/components/matching/OrganizationMatchingEmpty.tsx`
  - Matching page fallback action normalization: `src/app/app/i/matching/page.tsx`
  - Privacy quick fixes: `src/components/settings/PrivacyOverview.tsx`
- Added rollout monitoring endpoint:
  - `src/app/api/admin/metrics/rollout/route.ts`
- Updated compatibility details:
  - Assignment activation criteria now mode-aware in `src/lib/assignments/activation.ts`
  - Vocabulary policy now flag-aware defaults in `src/lib/copy/vocabulary.ts`
  - Privacy summary UI now flag-aware in `src/components/profile/PrivacySettings.tsx` and `src/components/settings/PrivacyOverview.tsx`

Why:

- Implement remaining items from the approved complexity-reduction rollout plan:
  - staged flag-driven rollout controls,
  - complete Basic vs Advanced assignment path in the live org flow,
  - SLA presets,
  - standardized remediation actions in empty states,
  - rollout metrics visibility for monitoring.

How to verify:

- `npm run typecheck` -> PASS
- `npm run lint` -> PASS
- `npm run test -- src/lib/__tests__/matching-eligibility.test.ts tests/api/assignments-publish-route.test.ts tests/api/assignment-publish.test.ts` -> PASS
- Manual smoke:
  - Org assignment builder shows Basic/Advanced mode and skips Weight Matrix in Basic.
  - Individual matching blocked/empty states show exactly 3 remediation actions.
  - `GET /api/feature-flags` returns user-scoped rollout flags.
  - `GET /api/admin/metrics/rollout` returns rollout indicators for last N days.

Open risks / TODO:

- The new interview policy preset UI/API path is implemented but not yet wired to a known production page route in this pass.
- No dedicated tests were added yet for:
  - `/api/feature-flags`
  - `/api/admin/metrics/rollout`
  - Interview preset policy branching in `/api/interviews/schedule`.
