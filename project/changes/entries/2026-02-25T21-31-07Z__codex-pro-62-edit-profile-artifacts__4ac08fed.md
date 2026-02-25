# Project Change Entry

- Date/time (UTC): 2026-02-25T21:31:07Z
- Branch: codex-pro-62-edit-profile-artifacts
- Base commit: 4ac08fed
  What changed:
- Added missing profile artifact update server actions in `src/actions/profile.ts`:
  - `updateImpactStory(id, data)`
  - `updateExperience(id, data)`
- Added hook update methods in `src/hooks/useProfileData.ts` with optimistic state updates:
  - `updateImpactStory`
  - `updateExperience`
- Added edit entry points to individual profile artifact tabs:
  - `src/components/profile/editable-profile/ImpactTab.tsx`
  - `src/components/profile/editable-profile/JourneyTab.tsx`
- Propagated new edit callbacks through:
  - `src/components/profile/editable-profile/ProfileTabsSection.tsx`
  - `src/components/profile/EditableProfileView.tsx`
- Extended dialog routing in `src/components/profile/editable-profile/ProfileDialogs.tsx` so Impact and Experience forms now support add vs edit mode like Education/Volunteering.
- Added and updated test coverage:
  - `tests/actions/profile.test.ts`
  - `tests/ui/profile-dialogs-edit-routing.test.tsx`
  - `tests/ui/profile-artifact-edit-actions.test.tsx` (new)

Why:

- Linear `PRO-62` reported missing edit functionality for profile artifacts in Impact and Journey tabs. Users could only delete those items while other tabs already supported edit.

How to verify:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH NEXT_PUBLIC_SITE_URL=http://proofound.local npm run lint` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH NEXT_PUBLIC_SITE_URL=http://proofound.local npm run test -- tests/actions/profile.test.ts tests/ui/profile-dialogs-edit-routing.test.tsx tests/ui/impact-story-form.test.tsx tests/ui/experience-form.test.tsx` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH NEXT_PUBLIC_SITE_URL=http://proofound.local npm run test` (PASS, 536 tests)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH NEXT_PUBLIC_SITE_URL=http://proofound.local npm run build` (PASS)

Open risks / TODO:

- Local runs still print expected warnings when `DATABASE_URL` is unset and mock DB mode is active.
- Build/test logs include existing non-blocking warnings unrelated to this change (for example baseline-browser-mapping freshness and legacy test warnings).
