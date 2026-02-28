# Project Change Entry

- Date/time (UTC): 2026-02-28T09:21:32Z
- Branch: codex-pdfjs-webpack-types
- Base commit: a8dd3e1c
  What changed:
- Added requester-side delete API for sent verification requests:
  - `DELETE /api/expertise/verifications/sent/[requestType]/[requestId]`
  - Enforces ownership and status gating (`skill: pending`, `impact_story: pending|failed`).
  - Returns `409 { code: "BUNDLED_REQUEST", customRequestId }` for bundled skill requests.
- Added bundle management API:
  - `GET /api/expertise/verifications/custom/[requestId]`
  - `PATCH /api/expertise/verifications/custom/[requestId]` with `action: cancel_selected`.
  - Cancels selected pending bundle items, removes linked pending skill verification rows, expires bundle when no pending items remain.
- Updated sent verifications UI:
  - Added delete/manage action on eligible sent cards.
  - Added bundle-cancel dialog with pending artifact selection.
  - Added `custom_request_id` plumbing from verifications page query to client.
- Updated Edit Skill verification UI:
  - Pending verification requests now have delete action.
  - Bundled delete attempts show guidance to manage cancellations in `/app/i/verifications`.
- Added/updated tests:
  - `tests/api/expertise-verifications-sent-delete-route.test.ts`
  - `tests/api/expertise-verifications-custom-route.test.ts`
  - `tests/ui/verifications-client.test.tsx`
  - `tests/ui/edit-skill-window-proofs.test.tsx`

Why:

- Users needed self-service cleanup for mistaken or obsolete sent verification requests.
- Bundled custom verification requests required partial cancellation (artifact-level) instead of all-or-nothing behavior.

How to verify:

- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run typecheck` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test -- tests/api/expertise-skill-verification-request-route.test.ts tests/api/expertise-verifications-sent-delete-route.test.ts tests/api/expertise-verifications-custom-route.test.ts tests/ui/verifications-client.test.tsx tests/ui/edit-skill-window-proofs.test.tsx` (PASS)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run lint` (PASS with existing unrelated warnings)
- `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run test` (FAIL due unrelated pre-existing tests in `tests/actions/profile.test.ts` and `tests/actions/create-impact-story.test.ts`)

Open risks / TODO:

- Full-suite failures in impact-story action tests are unrelated to this change but still block a fully green `npm run test`.
- Bundle cancellation flow currently removes linked skill requests only; other artifact request types remain status-driven via custom bundle item state.
