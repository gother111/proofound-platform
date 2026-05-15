# Project Change Entry

- Date/time (UTC): 2026-05-15T21:54:47Z
- Branch: codex-pro-210-jd-import-assignment-builder
- Base commit: cd7949f5
  What changed:
- Added a profile-facing `ProfileProofPack` data shape and mapped canonical Proof Pack aggregates into it in `getProfileData`.
- Passed proof packs into the profile tab section and replaced the old Proof Packs count card with a sortable grid.
- Added sort modes for newest, strongest proof, verification state, context type, visibility, and role relevance from existing data only.
- Each grid card now surfaces artifacts, context, outcomes, linked skills, verification state, visibility, freshness, and role context.
- Added focused UI coverage for the sortable Proof Packs grid.

Why:

- PRO-198 requires Proof Packs to be easier to browse and compare without adding social ranking, popularity mechanics, or unsupported filters.

How to verify:

- `npm run test -- tests/ui/profile-artifact-edit-actions.test.tsx`
- `npx eslint src/components/profile/editable-profile/ImpactTab.tsx src/components/profile/editable-profile/ProfileTabsSection.tsx src/components/profile/EditableProfileView.tsx src/actions/profile.ts src/types/profile.ts tests/ui/profile-artifact-edit-actions.test.tsx`
- `npx prettier --check src/components/profile/editable-profile/ImpactTab.tsx src/components/profile/editable-profile/ProfileTabsSection.tsx src/actions/profile.ts src/types/profile.ts tests/ui/profile-artifact-edit-actions.test.tsx`

Open risks / TODO:

- Repo-wide typecheck and lint are currently blocked by unrelated dirty-tree errors outside this change.
- Authenticated visual verification needs a signed-in or mock-auth local session; isolated screenshot only verified compile and login redirect.
