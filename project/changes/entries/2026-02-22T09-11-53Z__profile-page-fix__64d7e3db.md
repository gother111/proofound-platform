# Project Change Entry

- Date/time (UTC): 2026-02-22T09:11:53Z
- Branch: profile-page-fix
- Base commit: 64d7e3db

What changed:

- `src/components/profile/EditableProfileView.tsx`: imported `ProfileSkeleton` and replaced the plain "Loading profile..." text with `ProfileSkeleton` during data fetch. Fixes the perceived blank screen on first client-side navigation to `/app/i/profile`.
- `src/actions/profile.ts`: added re-throw guard in `getProfileData` outer catch block for Next.js `redirect()` and `notFound()` errors (detected via `error.digest`). Prevents auth redirect from being silently swallowed and returning a hardcoded empty profile to unauthenticated users.
- `src/hooks/useProfileData.ts`: added same re-throw guard in the `.catch()` of the profile fetch effect so redirect errors propagate correctly from client components.
- `src/lib/privacy/profile-fetcher.ts`: corrected two `.eq('id', profileId)` calls to `.eq('user_id', profileId)` in `fetchRedactedIndividualProfile` and `fetchCompleteRedactedProfile`. Resolved "column individual_profiles.id does not exist" Supabase RPC error.

Why:

- New users (no `individual_profiles` row) and users navigating to the profile page via client-side navigation saw a blank or empty-looking screen.
- The `profile-fetcher.ts` bug caused public API profile lookups to fail with a PG column error.
- The `redirect()` swallow could return empty profile data to unauthenticated callers instead of redirecting them to `/login`.
- The "Loading profile..." plain text was barely visible and triggered by the same slow server action that caused the empty-looking screen.

How to verify:

- Log into the app as any individual user.
- From a different page (e.g. `/app/i/home`), click "Profile" in the left sidebar.
- Confirm a skeleton loading UI appears immediately instead of a blank screen.
- Confirm the full profile loads after the server action completes.
- `npm run lint`
- `npm run typecheck`

Open risks / TODO:

- `getProfileData` cold start is slow on a dev server that has been running for many hours. Consider pre-warming the DB connection or showing optimistic profile data from a lighter endpoint.
- `profile-fetcher.ts` fix resolves the public API bug; verify public profile pages (`/p/[handle]`) work correctly end-to-end.
