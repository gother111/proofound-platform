# Project Change Entry

- Date/time (UTC): 2026-05-15T21:59:12Z
- Branch: codex-pro-210-jd-import-assignment-builder
- Base commit: cd7949f5
  What changed:
- PRO-206 guest assignment landing now renders a structured assignment view before account actions for unauthenticated invite visitors.
- Candidate invite preview data now includes assignment role/focus, work summary, engagement/location/timing/compensation details, proof expectations, skills, and verification gates.
- Claimed proof-card invite submissions now use owner-only Proof Pack selection plus final visibility confirmation, rather than public profile snippet/share URL submission.
- Added regression tests for the assignment-first guest page, privacy-safe copy constraints, and owner-only Proof Pack application submission.

Why:

- PRO-206 requires cold external assignment links to behave like assignment-specific invitations: clear assignment context first, one Apply entry, blind-by-default privacy framing, and no generic branding/profile/ranking/public-directory drift.

How to verify:

- `npm run test -- tests/ui/candidate-invite-client.test.tsx`
- `npm run test -- tests/api/candidate-invite-proof-card-route.test.ts tests/api/candidate-invite-claim-route.test.ts`
- `npm run lint`

Open risks / TODO:

- `npm run typecheck` is still blocked by unrelated dirty-worktree onboarding/profile outcome typing errors and generated `.next` onboarding types.
- Commit isolation was not attempted because the current branch contains a broad pre-existing dirty worktree unrelated to PRO-206.
