# Project Change Entry

- Date/time (UTC): 2026-07-06T09:28:19Z
- Branch: warroom-p0-activation
- Base commit: a7b7306e
  What changed:
- Enabled weekly digest availability by default behind `WEEKLY_DIGEST_ENABLED=false`.
- Added blind-safe skill verification request reminders on day 5 and day 10 through the existing decision-reminders cron dispatcher.
- Reissued scoped capability tokens for reminder links and tracked reminder count/stages in `verification_records.metadata` plus `last_follow_up_at`.
- Aligned active skill verification request expiry copy/resend behavior to the canonical 14-day window.

Why:

- P0-8 requires re-engagement for users with no matches and follow-up for pending verification requests without adding a new Vercel cron.
- Reminder copy must preserve the pre-reveal privacy contract and respect verifier email notification preferences when they exist.

How to verify:

- `npm run lint`
- `npm run typecheck`
- `npm run test -- src/lib/notifications/__tests__/weekly-digest.test.ts tests/lib/verification-request-reminders.test.ts src/app/api/cron/decision-reminders/__tests__/route.test.ts tests/scripts/cron-scheduling.test.ts tests/lib/workflow-email-privacy.test.ts`
- `npm run test`
- `npm run docs:freshness`
- `npm run build`

Open risks / TODO:

- No migration was added; RLS policies are unchanged. Reminder state uses existing canonical verification metadata and follow-up timestamp fields.
- `npm run docs:freshness` remains in warning mode for existing orphan-file warnings unrelated to this change.
