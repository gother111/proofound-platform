# Privacy And Provider Policy Report

## Privacy Invariant

The Start from CV assistant must remain user-owned, consented, private, draft-only, and non-evaluative. It must not create public profile output, verification state, trust state, matching lift, scoring, ranking, shortlisting, or hiring decisions from a CV.

## Implemented Controls

- Per-session consent remains required before extraction.
- Non-final expired sessions are rejected.
- Accept requires a `ready_for_review` session or idempotently returns an already accepted session.
- Accepted draft IDs must exist in the stored draft payload.
- Raw CV text is redacted before structuring and not persisted by this flow.
- Provider policy blocks live calls for unapproved trial providers.
- If provider policy denies a live call, deterministic local drafting is used.

## Verification

- `npm run test:launch:ai`: PASS.
- Focused provider and Start from CV tests: PASS.
- `npm run test:privacy`: BLOCKED because Supabase test credentials are missing.

## Remaining Gate

Add dedicated database-backed tests for `start_from_cv_import_sessions` owner isolation, expired-session behavior, accepted-payload integrity, and retention cleanup evidence.
