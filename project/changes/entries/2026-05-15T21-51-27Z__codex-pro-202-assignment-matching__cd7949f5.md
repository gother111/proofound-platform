# Project Change Entry

- Date/time (UTC): 2026-05-15T21:51:27Z
- Branch: codex/pro-188-first-proof-verification
- Base commit: cd7949f5
  What changed:
- Organization navigation now points to Assignments instead of a top-level Matching view.
- `/app/o/[slug]/matching` redirects to `/app/o/[slug]/assignments` for compatibility.
- Assignment cards expose an explicit Matching button that opens the matching grid for that assignment.
- `/api/assignments` returns lightweight per-assignment matching summaries with candidate count and latest match/review activity.
- Assignment cards show a non-urgent badge only when that assignment has unseen matching/review activity since the local last-viewed marker.
- Publish/recovery/dashboard links now return organizations to the assignment-owned matching corridor.

Why:

- PRO-202 requires matching to belong to a specific assignment corridor rather than a detached organization talent feed.

How to verify:

- `npm run test -- tests/ui/matching-organization-view-beta.test.tsx tests/api/assignments.test.ts src/lib/launch/__tests__/surface-policy.test.ts`
- Open `/app/o/:slug/assignments`, use an assignment card's Matching button, and confirm matches load for that assignment only.
- Open `/app/o/:slug/matching` and confirm it redirects to `/app/o/:slug/assignments`.

Open risks / TODO:

- Full typecheck remains blocked by unrelated existing dirty-worktree errors outside this change.
